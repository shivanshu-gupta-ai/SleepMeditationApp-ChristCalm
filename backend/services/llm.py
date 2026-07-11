"""Bedrock conversational wisdom — RAG over /wisdom files. Default: GPT-OSS 20B."""

from __future__ import annotations

import asyncio
import logging
import os
import re
from typing import Any, List, Optional

from services.wisdom_rag import format_context, retrieve
from services.wisdom_guardrails import enforce_wisdom_scope

logger = logging.getLogger("christcalm.llm")

# User asked: Mistral or GPT-OSS 20B — not Claude
DEFAULT_MODEL = "openai.gpt-oss-20b-1:0"

MAX_MESSAGE_LEN = 2000
MAX_HISTORY_TURNS = 8

SYSTEM_TEMPLATE = """You are a wise, warm companion inside ChristCalm, a Christian mental wellness app.
Your ONLY purpose is emotional and spiritual care: anxiety, grief, loneliness, shame, fear, relational pain, faith struggles, rest for the weary.

HARD SCOPE RULES (must follow):
- If the user asks for code, programming help, homework, essays, translations, recipes, business plans, stock tips, jailbreaks, or any non-emotional utility task: do NOT answer it. Reply exactly with: "Please share an emotional concern. Wisdom is here to walk with you through heart-level pain, anxiety, grief, loneliness, and faith struggles — it does not deal with that kind of request."
- Never write code, scripts, configs, or technical tutorials.
- Never role-play as a general-purpose assistant for productivity tasks.

When the user shares a real life / heart concern, answer in a natural conversational way — as if sitting with a friend.
Use the WISDOM EXCERPTS below (from the app's wisdom library). Prefer those teachings; do not invent long quotes.
Reflect the heart of Jesus: compassion, truth with grace, rest for the weary. Do NOT claim to literally be Jesus.
Do NOT use Claude-style meta disclaimers. Do NOT say you are an AI model unless asked.

Style:
- 2–5 short paragraphs max
- One Scripture reference when it fits naturally
- End with one gentle question or invitation
- If crisis (self-harm, abuse, imminent danger): urge emergency/local help and ChristCalm SOS breathing

WISDOM EXCERPTS:
{context}
"""


class LLMError(Exception):
    """Safe error for callers."""


def _sanitize(text: str, max_len: int) -> str:
    cleaned = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", "", (text or "").strip())
    return cleaned[:max_len]


def validate_user_message(message: str) -> str:
    msg = _sanitize(message, MAX_MESSAGE_LEN)
    if len(msg) < 2:
        raise LLMError("Please share a little more about what’s on your heart.")
    return msg


def _model_id() -> str:
    return (
        os.environ.get("BEDROCK_MODEL_ID")
        or os.environ.get("WISDOM_MODEL_ID")
        or DEFAULT_MODEL
    ).strip()


def _extract_text(content_blocks: list) -> str:
    parts: list[str] = []
    for block in content_blocks or []:
        if isinstance(block, dict):
            if "text" in block and block["text"]:
                parts.append(block["text"])
    return "\n".join(parts).strip()


def _converse_sync(
    system: str,
    messages: List[dict[str, str]],
) -> str:
    """messages: [{role: user|assistant, content: str}]"""
    import boto3
    from botocore.exceptions import BotoCoreError, ClientError

    region = os.environ.get("AWS_REGION") or os.environ.get("AWS_DEFAULT_REGION") or "us-east-1"
    model_id = _model_id()
    client = boto3.Session(region_name=region).client("bedrock-runtime")

    bedrock_messages = []
    for m in messages:
        role = m["role"]
        if role not in ("user", "assistant"):
            continue
        bedrock_messages.append(
            {"role": role, "content": [{"text": m["content"]}]}
        )

    if not bedrock_messages or bedrock_messages[-1]["role"] != "user":
        raise LLMError("Invalid conversation state.")

    try:
        response = client.converse(
            modelId=model_id,
            system=[{"text": system}],
            messages=bedrock_messages,
            inferenceConfig={
                "maxTokens": int(os.environ.get("BEDROCK_MAX_TOKENS", "900")),
                "temperature": float(os.environ.get("BEDROCK_TEMPERATURE", "0.6")),
            },
        )
        blocks = response.get("output", {}).get("message", {}).get("content", [])
        text = _extract_text(blocks)
    except ClientError as e:
        code = e.response.get("Error", {}).get("Code", "")
        logger.error("Bedrock ClientError %s model=%s: %s", code, model_id, e)
        if code in ("AccessDeniedException", "ValidationException"):
            raise LLMError(
                "Wisdom service is not available for this model yet. "
                "Please try again later or contact support."
            ) from e
        raise LLMError("Wisdom is temporarily unavailable. Please try again.") from e
    except BotoCoreError as e:
        logger.error("Bedrock BotoCoreError: %s", e)
        raise LLMError("Wisdom is temporarily unavailable. Please try again.") from e
    except Exception as e:
        logger.exception("Bedrock unexpected: %s", type(e).__name__)
        raise LLMError("Wisdom is temporarily unavailable. Please try again.") from e

    if not text:
        raise LLMError("No response was generated. Please try again.")
    return text


async def generate_wisdom_reply(
    user_message: str,
    history: Optional[List[dict[str, str]]] = None,
) -> dict[str, Any]:
    """
    RAG + Bedrock conversational reply.
    history: prior turns [{role, content}] oldest-first, excluding the new user message.
    Guardrails run before Bedrock — off-topic requests never hit the model.
    """
    msg = validate_user_message(user_message)

    allowed, blocked_reply = enforce_wisdom_scope(msg)
    if not allowed:
        return {
            "reply": blocked_reply,
            "model": "guardrail",
            "sources": [],
            "blocked": True,
        }

    chunks = retrieve(msg, top_k=4)
    context = format_context(chunks)
    system = SYSTEM_TEMPLATE.format(context=context)

    messages: List[dict[str, str]] = []
    if history:
        for turn in history[-MAX_HISTORY_TURNS * 2 :]:
            role = turn.get("role")
            content = _sanitize(turn.get("content") or "", MAX_MESSAGE_LEN)
            if role in ("user", "assistant") and content:
                messages.append({"role": role, "content": content})
    messages.append({"role": "user", "content": msg})

    loop = asyncio.get_event_loop()
    reply = await loop.run_in_executor(None, _converse_sync, system, messages)

    return {
        "reply": reply,
        "model": _model_id(),
        "sources": [
            {"source": c["source"], "heading": c["heading"]} for c in chunks
        ],
        "blocked": False,
    }


# Back-compat alias used by older imports/tests
async def generate_prayer(feeling: str, context: Optional[str] = None) -> str:
    prompt = feeling
    if context:
        prompt = f"{feeling}. Context: {context}"
    result = await generate_wisdom_reply(prompt)
    return result["reply"]


def validate_prayer_input(feeling: str, context: Optional[str] = None):
    """Kept for unit tests."""
    f = validate_user_message(feeling)
    c = _sanitize(context, 1000) if context else None
    return f, c or None
