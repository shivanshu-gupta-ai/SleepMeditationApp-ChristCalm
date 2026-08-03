"""Mood, journal, and product feedback."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request

from api.deps import client_ip, enforce_rate_limit, get_current_user
from api.models import FEEDBACK_CATEGORIES, FeedbackIn, JournalIn, MoodLogIn
from data.dynamodb import db

router = APIRouter(tags=["user-content"])


@router.post("/mood/log")
async def log_mood(body: MoodLogIn, user: dict = Depends(get_current_user)):
    entry = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "emotion": body.emotion,
        "note": body.note,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.insert_mood_log(entry)
    return {"ok": True, "entry": entry}


@router.get("/mood/history")
async def mood_history(user: dict = Depends(get_current_user)):
    return {"logs": await db.list_mood_logs(user["id"], limit=100)}


@router.post("/journal")
async def create_journal(body: JournalIn, user: dict = Depends(get_current_user)):
    entry = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "mood": body.mood,
        "content": body.content,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.insert_journal_entry(entry)
    return {"ok": True, "entry": entry}


@router.get("/journal")
async def list_journal(user: dict = Depends(get_current_user)):
    return {"entries": await db.list_journal_entries(user["id"], limit=200)}


@router.post("/feedback")
async def submit_feedback(
    body: FeedbackIn,
    request: Request,
    user: dict = Depends(get_current_user),
):
    """
    Persist Me-tab product feedback for the authenticated user.
    Durable domain row in DynamoDB; free-text is never written to usage-events.
    """
    enforce_rate_limit(f"feedback:{user['id']}", limit=12, window=3600)
    enforce_rate_limit(f"feedback_ip:{client_ip(request)}", limit=30, window=3600)

    category = (body.category or "").strip().lower()
    if category not in FEEDBACK_CATEGORIES:
        raise HTTPException(
            status_code=422,
            detail=f"category must be one of: {', '.join(sorted(FEEDBACK_CATEGORIES))}",
        )
    message = (body.message or "").strip()
    if len(message) < 3:
        raise HTTPException(status_code=422, detail="message is too short")

    entry = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "category": category,
        "message": message[:2000],
        "stars": int(body.stars) if body.stars is not None else None,
        "platform": (body.platform or "unknown")[:32],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "status": "new",
    }
    await db.insert_user_feedback(entry)
    return {
        "ok": True,
        "feedback": {
            "id": entry["id"],
            "category": entry["category"],
            "stars": entry["stars"],
            "created_at": entry["created_at"],
            "status": entry["status"],
        },
    }


@router.get("/feedback")
async def list_feedback(user: dict = Depends(get_current_user)):
    """User's own past feedback submissions (newest first)."""
    return {"items": await db.list_user_feedback(user["id"], limit=50)}
