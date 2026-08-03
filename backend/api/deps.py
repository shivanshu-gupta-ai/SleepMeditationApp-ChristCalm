"""Shared FastAPI dependencies and small helpers."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from api.models import UserOut
from auth import cognito as cognito_auth
from core.rate_limit import limiter
from data.dynamodb import db

logger = logging.getLogger("christcalm")
security = HTTPBearer(auto_error=False)


def client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for") or request.headers.get("x-real-ip")
    if forwarded:
        return forwarded.split(",")[0].strip()[:64]
    if request.client:
        return (request.client.host or "unknown")[:64]
    return "unknown"


def enforce_rate_limit(key: str, limit: int, window: int) -> None:
    allowed, remaining, retry = limiter.check(key, limit, window)
    if not allowed:
        raise HTTPException(
            status_code=429,
            detail="Too many requests. Please wait and try again.",
            headers={"Retry-After": str(retry), "X-RateLimit-Remaining": "0"},
        )


async def get_current_user(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> dict:
    """Resolve the signed-in user from a Cognito access token only."""
    if not creds:
        raise HTTPException(status_code=401, detail="Missing auth token")
    if not cognito_auth.cognito_enabled():
        raise HTTPException(
            status_code=503,
            detail="Authentication is not configured. Set Cognito env vars.",
        )
    try:
        user = await cognito_auth.resolve_user_from_bearer(creds.credentials)
        if user:
            return user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
    raise HTTPException(status_code=401, detail="Invalid token")


async def get_optional_user(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> Optional[dict]:
    if not creds or not cognito_auth.cognito_enabled():
        return None
    try:
        return await cognito_auth.resolve_user_from_bearer(creds.credentials)
    except Exception:
        return None


async def resolve_premium_user(user: dict) -> dict:
    """Normalize free vs premium: expire lapsed plans and return fresh user row."""
    if not user or not user.get("id"):
        return user
    is_premium = bool(user.get("is_premium"))
    premium_until = user.get("premium_until")
    if is_premium and premium_until:
        try:
            until = datetime.fromisoformat(str(premium_until).replace("Z", "+00:00"))
            if until.tzinfo is None:
                until = until.replace(tzinfo=timezone.utc)
            if until < datetime.now(timezone.utc):
                return await db.update_user(
                    user["id"],
                    {
                        "is_premium": False,
                        "plan": None,
                        "premium_until": None,
                    },
                )
        except Exception:
            pass
    return user


def user_to_out(u: dict) -> UserOut:
    is_premium = bool(u.get("is_premium", False))
    return UserOut(
        id=u["id"],
        name=u["name"],
        email=u["email"],
        is_premium=is_premium,
        subscription_tier="premium" if is_premium else "free",
        plan=u.get("plan"),
        premium_until=u.get("premium_until"),
        provider=u.get("provider"),
        faith_journey=u.get("faith_journey"),
        concerns=u.get("concerns", []),
        streak=u.get("streak", 0),
        minutes_meditated=u.get("minutes_meditated", 0),
        prayers_completed=u.get("prayers_completed", 0),
    )


def assistant_text(turn: dict) -> str:
    """Prefer assistant_message; accept older rows that only stored prayer."""
    return (turn.get("assistant_message") or turn.get("prayer") or "").strip()
