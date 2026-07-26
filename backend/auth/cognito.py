"""Validate AWS Cognito tokens via Cognito API (no native crypto deps on Lambda)."""

from __future__ import annotations

import os
import uuid
from datetime import datetime, timezone
from typing import Optional

import boto3
from botocore.exceptions import ClientError

from data.dynamodb import db


def cognito_enabled() -> bool:
    return bool(os.environ.get("COGNITO_USER_POOL_ID") and os.environ.get("COGNITO_CLIENT_ID"))


def _region() -> str:
    return os.environ.get("AWS_REGION", os.environ.get("COGNITO_REGION", "us-east-1"))


def _client():
    return boto3.client("cognito-idp", region_name=_region())


def _claims_from_user_response(resp: dict) -> dict:
    attrs = {a["Name"]: a["Value"] for a in resp.get("UserAttributes", [])}
    username = resp.get("Username", "")
    return {
        "sub": attrs.get("sub") or username,
        "email": (attrs.get("email") or "").lower().strip(),
        "name": attrs.get("name") or attrs.get("given_name") or "",
        "cognito:username": username,
        "identities": attrs.get("identities"),
    }


def validate_access_token(access_token: str) -> dict:
    """Validate access token with Cognito GetUser — works on Lambda without cryptography."""
    try:
        resp = _client().get_user(AccessToken=access_token)
        return _claims_from_user_response(resp)
    except ClientError as e:
        code = e.response.get("Error", {}).get("Code", "")
        if code in ("NotAuthorizedException", "UserNotFoundException"):
            raise ValueError("Invalid or expired token") from e
        raise


def _provider_from_claims(claims: dict) -> str:
    username = str(claims.get("cognito:username", ""))
    if username.startswith("Google_"):
        return "google"
    if username.startswith("SignInWithApple_"):
        return "apple"
    return "cognito"


async def ensure_user_from_claims(claims: dict) -> dict:
    """Find or create DynamoDB profile for a Cognito-authenticated user."""
    sub = claims.get("sub")
    if not sub:
        raise ValueError("Token missing sub")

    email = (claims.get("email") or "").lower().strip()
    name = (
        claims.get("name")
        or (email.split("@")[0] if email else "Friend")
    )

    email_norm = (email or "").strip().lower()
    # Optional dev-only auto-premium for seed account. Never enable in App Store / prod API.
    # Set ALLOW_PREVIEW_TEST_PREMIUM=1 on local/dev Lambda only.
    allow_preview_premium = os.environ.get("ALLOW_PREVIEW_TEST_PREMIUM", "").strip() in {
        "1",
        "true",
        "yes",
    }
    is_test = allow_preview_premium and email_norm in {"test@christcalm.dev"}

    existing = await db.get_user_by_cognito_sub(sub)
    if existing:
        updates: dict = {"last_login_at": datetime.now(timezone.utc).isoformat()}
        if email and existing.get("email") != email:
            updates["email"] = email
        if name and not existing.get("name"):
            updates["name"] = name
        # Dev-only: keep seed account unlocked when flag is on
        if is_test and not existing.get("is_premium"):
            updates["is_premium"] = True
            updates["plan"] = "preview"
            updates["subscription_provider"] = "preview"
        if updates:
            return await db.update_user(existing["id"], updates)
        return existing

    if email:
        by_email = await db.get_user_by_email(email)
        if by_email:
            updates = {
                "cognito_sub": sub,
                "provider": _provider_from_claims(claims),
                "last_login_at": datetime.now(timezone.utc).isoformat(),
            }
            if is_test:
                updates["is_premium"] = True
                updates["plan"] = "preview"
                updates["subscription_provider"] = "preview"
            return await db.update_user(by_email["id"], updates)

    # New users are free until RevenueCat webhook / purchase sync.
    user_doc = {
        "id": str(uuid.uuid4()),
        "cognito_sub": sub,
        "name": str(name).strip() or "Friend",
        "email": email or f"{sub}@users.christcalm.app",
        "provider": _provider_from_claims(claims),
        "is_premium": is_test,
        "plan": "preview" if is_test else None,
        "premium_until": None,
        "subscription_provider": "preview" if is_test else None,
        "faith_journey": None,
        "concerns": [],
        "streak": 0,
        "minutes_meditated": 0,
        "prayers_completed": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "last_login_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.create_user(user_doc)
    return user_doc


async def resolve_user_from_bearer(token: str) -> Optional[dict]:
    if not cognito_enabled():
        return None
    claims = validate_access_token(token)
    return await ensure_user_from_claims(claims)