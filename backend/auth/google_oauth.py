"""Google OAuth 2.0 — authorization code flow with signed state."""

import os
from datetime import datetime, timezone, timedelta
from typing import Optional
from urllib.parse import urlencode

import httpx
import jwt as pyjwt

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"


def _jwt_secret() -> str:
    return os.environ["JWT_SECRET"]


def _client_id() -> str:
    client_id = os.environ.get("GOOGLE_CLIENT_ID")
    if not client_id:
        raise RuntimeError("GOOGLE_CLIENT_ID is not configured")
    return client_id


def _client_secret() -> str:
    secret = os.environ.get("GOOGLE_CLIENT_SECRET")
    if not secret:
        raise RuntimeError("GOOGLE_CLIENT_SECRET is not configured")
    return secret


def _backend_callback_url() -> str:
    url = os.environ.get("GOOGLE_REDIRECT_URI")
    if not url:
        raise RuntimeError("GOOGLE_REDIRECT_URI is not configured")
    return url.rstrip("/")


def allowed_redirect_origins() -> list[str]:
    raw = os.environ.get("CORS_ORIGINS", "")
    return [o.strip().rstrip("/") for o in raw.split(",") if o.strip()]


def _is_allowed_mobile_redirect(redirect_uri: str) -> bool:
    """Expo / React Native deep links used after Google OAuth on device."""
    mobile_prefixes = (
        "exp://",
        "exps://",
        "com.christcalm.app://",
        "frontend://",
    )
    if any(redirect_uri.startswith(p) for p in mobile_prefixes):
        return True
    if redirect_uri.startswith("http://localhost") or redirect_uri.startswith("http://127.0.0.1"):
        return True
    return False


def validate_frontend_redirect(redirect_uri: str) -> str:
    redirect_uri = redirect_uri.rstrip("/")
    if _is_allowed_mobile_redirect(redirect_uri):
        return redirect_uri
    for origin in allowed_redirect_origins():
        if redirect_uri == origin or redirect_uri.startswith(origin + "/"):
            return redirect_uri
    raise ValueError("redirect_uri is not allowed")


def build_authorization_url(frontend_redirect_uri: str) -> str:
    frontend_redirect_uri = validate_frontend_redirect(frontend_redirect_uri)
    state = pyjwt.encode(
        {
            "redirect_uri": frontend_redirect_uri,
            "exp": datetime.now(timezone.utc) + timedelta(minutes=10),
            "iat": datetime.now(timezone.utc),
        },
        _jwt_secret(),
        algorithm="HS256",
    )
    params = {
        "client_id": _client_id(),
        "redirect_uri": _backend_callback_url(),
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "online",
        "prompt": "select_account",
        "state": state,
    }
    return f"{GOOGLE_AUTH_URL}?{urlencode(params)}"


def decode_state(state: str) -> str:
    try:
        payload = pyjwt.decode(state, _jwt_secret(), algorithms=["HS256"])
    except pyjwt.PyJWTError as e:
        raise ValueError("Invalid OAuth state") from e
    return payload["redirect_uri"]


async def exchange_code_for_profile(code: str) -> dict:
    async with httpx.AsyncClient(timeout=15.0) as client:
        token_res = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": _client_id(),
                "client_secret": _client_secret(),
                "redirect_uri": _backend_callback_url(),
                "grant_type": "authorization_code",
            },
        )
        if token_res.status_code != 200:
            raise ValueError("Failed to exchange Google authorization code")

        access_token = token_res.json().get("access_token")
        if not access_token:
            raise ValueError("Missing access token from Google")

        profile_res = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if profile_res.status_code != 200:
            raise ValueError("Failed to fetch Google user profile")

        profile = profile_res.json()
        email = (profile.get("email") or "").lower().strip()
        if not email:
            raise ValueError("Missing email from Google profile")
        return {
            "email": email,
            "name": (profile.get("name") or "").strip() or email.split("@")[0],
            "picture": profile.get("picture"),
        }


def google_oauth_configured() -> bool:
    client_id = os.environ.get("GOOGLE_CLIENT_ID", "")
    client_secret = os.environ.get("GOOGLE_CLIENT_SECRET", "")
    redirect = os.environ.get("GOOGLE_REDIRECT_URI", "")
    return bool(
        client_id and client_id != "unset"
        and client_secret and client_secret != "unset"
        and redirect and redirect != "unset"
    )