"""Wisdom chat, history, and voice transcription."""

from __future__ import annotations

import json
import logging
import os
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse

from ai.llm import LLMError, generate_wisdom_reply, generate_wisdom_reply_stream
from ai.voice_transcribe import VoiceError, create_upload_url, start_and_wait_transcript
from ai.wisdom_guardrails import enforce_wisdom_scope
from ai.wisdom_rag import corpus_stats
from api.deps import assistant_text, client_ip, enforce_rate_limit, get_current_user
from api.models import VoicePresignIn, VoiceTranscribeIn, WisdomChatIn
from core.rate_limit import AI_LIMIT, AI_MONTHLY_LIMIT, AI_WINDOW
from data.dynamodb import db

logger = logging.getLogger("christcalm")
router = APIRouter(tags=["wisdom"])


def _history_from_turns(prior: list[dict]) -> list[dict]:
    history: list[dict] = []
    for turn in reversed(prior):
        if turn.get("user_message"):
            history.append({"role": "user", "content": turn["user_message"]})
        text = assistant_text(turn)
        if text:
            history.append({"role": "assistant", "content": text})
    return history


@router.get("/wisdom/status")
async def wisdom_status():
    """Public diagnostic — no secrets."""
    stats = corpus_stats()
    return {
        "ok": True,
        "model": os.environ.get("BEDROCK_MODEL_ID", "openai.gpt-oss-20b-1:0"),
        "provider": os.environ.get("LLM_PROVIDER", "bedrock"),
        **stats,
    }


@router.get("/wisdom/quota")
async def wisdom_quota(user: dict = Depends(get_current_user)):
    """Monthly AI call budget remaining for this user (100 / month UTC)."""
    return await db.get_ai_quota(user["id"], limit=AI_MONTHLY_LIMIT)


@router.post("/wisdom/chat")
async def wisdom_chat(
    body: WisdomChatIn,
    request: Request,
    user: dict = Depends(get_current_user),
):
    """Conversational wisdom: RAG + Bedrock with emotional/spiritual guardrails."""
    enforce_rate_limit(f"wisdom:chat:{user['id']}", AI_LIMIT, AI_WINDOW)
    enforce_rate_limit(f"wisdom:chat:ip:{client_ip(request)}", AI_LIMIT * 2, AI_WINDOW)

    conversation_id = (body.conversation_id or "").strip() or str(uuid.uuid4())
    msg = body.message.strip()

    allowed, blocked_reply = enforce_wisdom_scope(msg)
    if not allowed:
        quota = await db.get_ai_quota(user["id"], limit=AI_MONTHLY_LIMIT)
        return {
            "conversation_id": conversation_id,
            "message_id": str(uuid.uuid4()),
            "reply": blocked_reply,
            "sources": [],
            "model": "guardrail",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "blocked": True,
            "ai_quota": quota,
        }

    quota = await db.consume_ai_quota(user["id"], limit=AI_MONTHLY_LIMIT)
    if not quota.get("ok"):
        raise HTTPException(
            status_code=429,
            detail=(
                f"You've used all {AI_MONTHLY_LIMIT} Wisdom messages for this month. "
                "Your allowance resets next month. Please return then — we're still here for you."
            ),
            headers={"X-AI-Quota-Remaining": "0"},
        )

    prior = await db.list_wisdom_turns(user["id"], conversation_id=conversation_id, limit=16)
    history = _history_from_turns(prior)

    try:
        result = await generate_wisdom_reply(msg, history=history)
    except LLMError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception:
        logger.exception("Wisdom chat failure user=%s", user.get("id"))
        raise HTTPException(
            status_code=503,
            detail="Wisdom is temporarily unavailable. Please try again.",
        )

    if result.get("blocked"):
        return {
            "conversation_id": conversation_id,
            "message_id": str(uuid.uuid4()),
            "reply": result["reply"],
            "sources": [],
            "model": "guardrail",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "blocked": True,
            "ai_quota": quota,
        }

    now = datetime.now(timezone.utc).isoformat()
    entry = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "kind": "wisdom",
        "conversation_id": conversation_id,
        "user_message": msg[:2000],
        "assistant_message": result["reply"],
        "sources": result.get("sources") or [],
        "model": result.get("model"),
        "created_at": now,
        "provider": "bedrock",
    }
    await db.insert_ai_prayer(entry)
    return {
        "conversation_id": conversation_id,
        "message_id": entry["id"],
        "reply": result["reply"],
        "sources": result.get("sources") or [],
        "model": result.get("model"),
        "created_at": now,
        "blocked": False,
        "ai_quota": quota,
    }


@router.post("/wisdom/chat/stream")
async def wisdom_chat_stream(
    body: WisdomChatIn,
    request: Request,
    user: dict = Depends(get_current_user),
):
    """Stream wisdom reply as SSE (text/event-stream)."""
    enforce_rate_limit(f"wisdom:chat:{user['id']}", AI_LIMIT, AI_WINDOW)
    enforce_rate_limit(f"wisdom:chat:ip:{client_ip(request)}", AI_LIMIT * 2, AI_WINDOW)

    conversation_id = (body.conversation_id or "").strip() or str(uuid.uuid4())
    msg = body.message.strip()
    message_id = str(uuid.uuid4())

    allowed, blocked_reply = enforce_wisdom_scope(msg)
    if not allowed:
        quota = await db.get_ai_quota(user["id"], limit=AI_MONTHLY_LIMIT)

        async def blocked_gen():
            payload_meta = {
                "type": "meta",
                "conversation_id": conversation_id,
                "message_id": message_id,
                "blocked": True,
                "sources": [],
                "model": "guardrail",
                "ai_quota": quota,
            }
            yield f"data: {json.dumps(payload_meta)}\n\n"
            yield f"data: {json.dumps({'type': 'delta', 'text': blocked_reply})}\n\n"
            yield f"data: {json.dumps({'type': 'done', 'conversation_id': conversation_id, 'message_id': message_id, 'reply': blocked_reply, 'sources': [], 'model': 'guardrail', 'blocked': True, 'ai_quota': quota, 'created_at': datetime.now(timezone.utc).isoformat()})}\n\n"

        return StreamingResponse(
            blocked_gen(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache, no-transform",
                "X-Accel-Buffering": "no",
                "Connection": "keep-alive",
            },
        )

    quota = await db.consume_ai_quota(user["id"], limit=AI_MONTHLY_LIMIT)
    if not quota.get("ok"):
        raise HTTPException(
            status_code=429,
            detail=(
                f"You've used all {AI_MONTHLY_LIMIT} Wisdom messages for this month. "
                "Your allowance resets next month. Please return then — we're still here for you."
            ),
            headers={"X-AI-Quota-Remaining": "0"},
        )

    prior = await db.list_wisdom_turns(user["id"], conversation_id=conversation_id, limit=16)
    history = _history_from_turns(prior)

    async def event_gen():
        full_parts: list[str] = []
        sources: list = []
        model_used = ""
        blocked = False
        try:
            yield f"data: {json.dumps({'type': 'meta', 'conversation_id': conversation_id, 'message_id': message_id, 'blocked': False, 'ai_quota': quota})}\n\n"

            async for ev in generate_wisdom_reply_stream(msg, history=history):
                et = ev.get("type")
                if et == "meta":
                    sources = ev.get("sources") or []
                    if ev.get("blocked"):
                        blocked = True
                    yield f"data: {json.dumps({'type': 'meta', 'conversation_id': conversation_id, 'message_id': message_id, 'blocked': bool(ev.get('blocked')), 'sources': sources, 'model': ev.get('model'), 'ai_quota': quota})}\n\n"
                elif et == "delta":
                    text = ev.get("text") or ""
                    if text:
                        full_parts.append(text)
                        yield f"data: {json.dumps({'type': 'delta', 'text': text})}\n\n"
                elif et == "done":
                    model_used = ev.get("model") or model_used
                    sources = ev.get("sources") or sources
                    blocked = bool(ev.get("blocked"))
                    reply = ev.get("reply") or "".join(full_parts)
                    now = datetime.now(timezone.utc).isoformat()
                    if not blocked and reply:
                        entry = {
                            "id": message_id,
                            "user_id": user["id"],
                            "kind": "wisdom",
                            "conversation_id": conversation_id,
                            "user_message": msg[:2000],
                            "assistant_message": reply,
                            "sources": sources,
                            "model": model_used,
                            "created_at": now,
                            "provider": "bedrock",
                        }
                        try:
                            await db.insert_ai_prayer(entry)
                        except Exception:
                            logger.exception("Failed to persist streamed wisdom turn")
                    yield f"data: {json.dumps({'type': 'done', 'conversation_id': conversation_id, 'message_id': message_id, 'reply': reply, 'sources': sources, 'model': model_used or 'guardrail', 'blocked': blocked, 'ai_quota': quota, 'created_at': now})}\n\n"
                    return
                elif et == "error":
                    yield f"data: {json.dumps({'type': 'error', 'message': ev.get('message') or 'Wisdom is temporarily unavailable.'})}\n\n"
                    return
        except LLMError as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
        except Exception:
            logger.exception("Wisdom stream failure user=%s", user.get("id"))
            yield f"data: {json.dumps({'type': 'error', 'message': 'Wisdom is temporarily unavailable. Please try again.'})}\n\n"

    return StreamingResponse(
        event_gen(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


@router.get("/wisdom/history")
async def wisdom_history(
    user: dict = Depends(get_current_user),
    conversation_id: Optional[str] = None,
):
    turns = await db.list_wisdom_turns(user["id"], conversation_id=conversation_id, limit=50)
    return {"turns": turns}


@router.post("/wisdom/voice/presign")
async def wisdom_voice_presign(
    body: VoicePresignIn,
    request: Request,
    user: dict = Depends(get_current_user),
):
    """Presigned S3 upload for a voice note (Amazon Transcribe input)."""
    enforce_rate_limit(f"wisdom:voice:{user['id']}", AI_LIMIT, AI_WINDOW)
    enforce_rate_limit(f"wisdom:voice:ip:{client_ip(request)}", AI_LIMIT * 2, AI_WINDOW)
    try:
        return create_upload_url(
            user["id"],
            media_ext=body.media_ext,
            content_type=body.content_type,
        )
    except VoiceError as e:
        raise HTTPException(status_code=e.status_code, detail=str(e))


@router.post("/wisdom/voice/transcribe")
async def wisdom_voice_transcribe(
    body: VoiceTranscribeIn,
    request: Request,
    user: dict = Depends(get_current_user),
):
    """
    Convert an uploaded voice note to text with Amazon Transcribe.
    Counts as 1 AI call toward the monthly quota.
    """
    enforce_rate_limit(f"wisdom:transcribe:{user['id']}", max(2, AI_LIMIT // 2), AI_WINDOW)
    enforce_rate_limit(
        f"wisdom:transcribe:ip:{client_ip(request)}", max(4, AI_LIMIT), AI_WINDOW
    )
    quota = await db.consume_ai_quota(user["id"], limit=AI_MONTHLY_LIMIT)
    if not quota.get("ok"):
        raise HTTPException(
            status_code=429,
            detail=(
                f"You've used all {AI_MONTHLY_LIMIT} AI actions for this month "
                "(including voice notes). Your allowance resets next month."
            ),
            headers={"X-AI-Quota-Remaining": "0"},
        )
    try:
        result = start_and_wait_transcript(
            user["id"],
            body.s3_key,
            media_format=body.media_format,
            language_code=body.language_code or "en-US",
        )
        return {
            "text": result["text"],
            "language_code": result.get("language_code"),
            "media_format": result.get("media_format"),
            "ai_quota": quota,
        }
    except VoiceError as e:
        raise HTTPException(status_code=e.status_code, detail=str(e))
    except Exception:
        logger.exception("Voice transcribe failure user=%s", user.get("id"))
        raise HTTPException(
            status_code=503,
            detail="Speech recognition is temporarily unavailable. Please type instead.",
        )
