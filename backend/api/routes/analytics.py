"""Product usage analytics ingest and summaries."""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Query, Request

from api.deps import client_ip, enforce_rate_limit, get_current_user, get_optional_user
from api.models import AnalyticsBatchIn
from data.dynamodb import db

router = APIRouter(tags=["analytics"])


@router.post("/analytics/events")
async def analytics_ingest(
    body: AnalyticsBatchIn,
    request: Request,
    user: Optional[dict] = Depends(get_optional_user),
):
    """
    Batch product usage events into DynamoDB for analysis.
    Auth preferred (user_id). Without auth uses device_id → anon:{id}.
    """
    enforce_rate_limit(
        f"analytics:{client_ip(request)}",
        limit=120,
        window=60,
    )
    if user:
        uid = user["id"]
    else:
        device = (body.device_id or "").strip()[:64] or "unknown"
        uid = f"anon:{device}"

    payload = [e.model_dump() for e in body.events]
    result = await db.put_usage_events(
        user_id=uid,
        events=payload,
        platform=(body.platform or "unknown")[:32],
        session_id=body.session_id,
    )
    return {"ok": True, **result, "user_id": uid}


@router.get("/analytics/me")
async def analytics_me(
    user: dict = Depends(get_current_user),
    limit: int = Query(40, ge=1, le=100),
):
    """Recent events for the signed-in user (debug / personal insight)."""
    events = await db.list_user_usage(user["id"], limit=limit)
    counts: dict[str, int] = {}
    for e in events:
        n = e.get("event_name") or "unknown"
        counts[n] = counts.get(n, 0) + 1
    return {"events": events, "counts": counts}


@router.get("/analytics/summary")
async def analytics_summary(
    user: dict = Depends(get_current_user),
    days: int = Query(7, ge=1, le=30),
):
    """
    Daily rollups for analysis (last N days).
    Restricted to signed-in users; treat as internal product metrics.
    """
    enforce_rate_limit(f"analytics_summary:{user['id']}", limit=30, window=60)
    summary = await db.usage_summary_for_days(days=days)
    return summary
