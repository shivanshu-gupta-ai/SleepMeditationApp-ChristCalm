"""Subscriptions: client sync + RevenueCat webhook."""

from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request

from api.deps import get_current_user, resolve_premium_user
from api.models import SubscriptionSyncIn
from data.dynamodb import db

router = APIRouter(tags=["billing"])

REVENUECAT_WEBHOOK_AUTHORIZATION = os.environ.get("REVENUECAT_WEBHOOK_AUTHORIZATION", "")
REVENUECAT_ENTITLEMENT_ID = os.environ.get("REVENUECAT_ENTITLEMENT_ID", "christcalm_premium")

PREMIUM_GRANT_EVENTS = {
    "INITIAL_PURCHASE",
    "RENEWAL",
    "UNCANCELLATION",
    "NON_RENEWING_PURCHASE",
    "PRODUCT_CHANGE",
    "SUBSCRIPTION_EXTENDED",
}
PREMIUM_REVOKE_EVENTS = {"EXPIRATION"}


def _plan_from_product(product_id: Optional[str]) -> Optional[str]:
    if not product_id:
        return None
    pid = product_id.lower()
    if "annual" in pid or "year" in pid:
        return "annual"
    if "month" in pid:
        return "monthly"
    return None


async def _set_premium(
    user_id: str,
    active: bool,
    plan: Optional[str] = None,
    expires_at: Optional[str] = None,
):
    payload = {
        "is_premium": active,
        "plan": plan if active else None,
        "premium_until": expires_at if active else None,
        "subscription_provider": "revenuecat",
    }
    await db.update_user(user_id, payload)


@router.post("/subscription/sync")
async def subscription_sync(body: SubscriptionSyncIn, user: dict = Depends(get_current_user)):
    plan = body.plan if body.plan in ("monthly", "annual") else None
    await _set_premium(user["id"], body.active, plan=plan)
    return {"ok": True, "active": body.active, "plan": plan}


@router.post("/revenuecat/webhook")
async def revenuecat_webhook(request: Request):
    auth_header = REVENUECAT_WEBHOOK_AUTHORIZATION
    if auth_header:
        auth = request.headers.get("Authorization", "")
        expected = f"Bearer {auth_header}"
        if auth != expected and auth != auth_header:
            raise HTTPException(status_code=401, detail="Unauthorized webhook")

    payload = await request.json()
    event = payload.get("event") or {}
    event_type = event.get("type")
    user_id = event.get("app_user_id")
    if not user_id or not event_type:
        return {"ok": True, "ignored": True}

    entitlements = event.get("entitlement_ids") or []
    has_entitlement = REVENUECAT_ENTITLEMENT_ID in entitlements or bool(entitlements)

    expires_at = event.get("expiration_at_ms")
    expires_iso = None
    if expires_at:
        try:
            expires_iso = datetime.fromtimestamp(int(expires_at) / 1000, tz=timezone.utc).isoformat()
        except Exception:
            expires_iso = None

    plan = _plan_from_product(event.get("product_id"))

    if event_type in PREMIUM_GRANT_EVENTS and has_entitlement:
        await _set_premium(user_id, True, plan=plan, expires_at=expires_iso)
    elif event_type in PREMIUM_REVOKE_EVENTS:
        await _set_premium(user_id, False)

    return {"ok": True, "event_type": event_type}


@router.get("/subscription/status")
async def subscription_status(user: dict = Depends(get_current_user)):
    fresh = await db.get_user_by_id(user["id"])
    if not fresh:
        return {
            "active": False,
            "is_premium": False,
            "subscription_tier": "free",
            "plan": None,
            "premium_until": None,
        }
    fresh = await resolve_premium_user(fresh)
    active = bool(fresh.get("is_premium"))
    return {
        "active": active,
        "is_premium": active,
        "subscription_tier": "premium" if active else "free",
        "plan": fresh.get("plan"),
        "premium_until": fresh.get("premium_until"),
    }
