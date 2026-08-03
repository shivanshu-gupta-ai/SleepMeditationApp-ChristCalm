"""Auth config, profile, and onboarding (Cognito-only)."""

from __future__ import annotations

import os

from fastapi import APIRouter, Depends

from api.deps import get_current_user, resolve_premium_user, user_to_out
from api.models import OnboardingIn, UserOut
from auth import cognito as cognito_auth
from data.dynamodb import db

router = APIRouter(tags=["auth"])


@router.get("/auth/config")
async def auth_config():
    """Public Cognito settings for the mobile app (no secrets)."""
    apple_svc = (os.environ.get("APPLE_SERVICES_ID") or "").strip()
    apple_ok = bool(apple_svc and apple_svc not in ("", "unset"))
    domain = (os.environ.get("COGNITO_DOMAIN") or "").strip()
    if domain and not domain.endswith(".amazoncognito.com") and "." not in domain:
        domain = f"{domain}.auth.{os.environ.get('AWS_REGION', 'us-east-1')}.amazoncognito.com"
    return {
        "provider": "cognito" if cognito_auth.cognito_enabled() else "unconfigured",
        "region": os.environ.get("AWS_REGION", "us-east-1"),
        "user_pool_id": os.environ.get("COGNITO_USER_POOL_ID"),
        "client_id": os.environ.get("COGNITO_CLIENT_ID"),
        "domain": domain,
        "apple_enabled": apple_ok,
        "social_setup": {
            "apple": "ready" if apple_ok else "needs_apple_secrets_and_enable_script",
            "docs": "config/auth/README.md",
            "enable_script": "./scripts/enable-apple-sign-in.sh",
        },
    }


@router.get("/auth/me", response_model=UserOut)
async def me(user: dict = Depends(get_current_user)):
    user = await resolve_premium_user(user)
    return user_to_out(user)


@router.post("/auth/onboarding", response_model=UserOut)
async def save_onboarding(body: OnboardingIn, user: dict = Depends(get_current_user)):
    updates: dict = {
        "faith_journey": body.faith_journey,
        "concerns": body.concerns,
        "emotional_state": body.emotional_state,
        "desired_support": body.desired_support,
        "preferred_time": body.preferred_time,
        "commitment_accepted": body.commitment_accepted,
        "commitment_date": body.commitment_date,
        "first_practices_done": body.first_practices_done,
    }
    if body.display_name and body.display_name.strip():
        updates["name"] = body.display_name.strip()
    updated = await db.update_user(user["id"], updates)
    return user_to_out(updated)
