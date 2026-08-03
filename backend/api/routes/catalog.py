"""Public catalog: emotions, meditations, prayers, devotionals."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException

from api.deps import get_current_user
from api.models import MeditationCompleteIn, MeditationRateIn
from data.dynamodb import db
from seed_data import DEVOTIONALS, EMOTIONS, MEDITATIONS, PRAYER_CATEGORIES, PRAYERS

router = APIRouter(tags=["catalog"])


@router.get("/emotions")
async def get_emotions():
    return {"emotions": EMOTIONS}


@router.get("/meditations")
async def list_meditations(emotion: Optional[str] = None):
    items = MEDITATIONS if not emotion else [m for m in MEDITATIONS if m["emotion"] == emotion]
    return {"meditations": items}


# Static paths must be registered before /meditations/{med_id}
@router.get("/meditations/ratings")
async def list_meditation_ratings(user: dict = Depends(get_current_user)):
    """All meditation session ratings for the current user (newest first)."""
    return {"ratings": await db.list_meditation_ratings(user["id"], limit=200)}


@router.post("/meditations/rate")
async def rate_meditation(body: MeditationRateIn, user: dict = Depends(get_current_user)):
    """
    Persist a per-session meditation rating (1–5) for the authenticated user in DynamoDB.
    Each submit creates a new row so re-listens can be rated independently.
    """
    entry = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "meditation_id": body.meditation_id.strip(),
        "stars": int(body.stars),
        "minutes": body.minutes,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.insert_meditation_rating(entry)
    return {"ok": True, "rating": entry}


@router.post("/meditations/complete")
async def complete_meditation(body: MeditationCompleteIn, user: dict = Depends(get_current_user)):
    updated = await db.increment_user_stats(user["id"], body.minutes)
    return {"ok": True, "minutes_meditated": updated.get("minutes_meditated", 0)}


@router.get("/meditations/{med_id}")
async def get_meditation(med_id: str):
    for m in MEDITATIONS:
        if m["id"] == med_id:
            return m
    raise HTTPException(status_code=404, detail="Not found")


@router.get("/prayers")
async def list_prayers(category: Optional[str] = None):
    items = PRAYERS if not category else [p for p in PRAYERS if p["category"] == category]
    return {"prayers": items, "categories": PRAYER_CATEGORIES}


@router.get("/devotional/today")
async def daily_devotional():
    idx = datetime.now(timezone.utc).timetuple().tm_yday % len(DEVOTIONALS)
    return DEVOTIONALS[idx]
