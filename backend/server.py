"""ChristCalm — FastAPI backend (Lambda + API Gateway + DynamoDB)."""
import os
import time
import uuid
import logging
import hashlib
import secrets
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Optional, List
from urllib.parse import quote

from core.config import bootstrap, require_jwt_secret

bootstrap()

import jwt as pyjwt
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Query, Request
from fastapi.responses import RedirectResponse, JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, Field
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.middleware.cors import CORSMiddleware

from seed_data import EMOTIONS, MEDITATIONS, PRAYERS, DEVOTIONALS, PRAYER_CATEGORIES
from auth import cognito as cognito_auth
from data.dynamodb import db
from ai.llm import generate_wisdom_reply, generate_prayer, LLMError
from ai.wisdom_rag import corpus_stats
from ai.voice_transcribe import (
    VoiceError,
    create_upload_url,
    start_and_wait_transcript,
)
from core.rate_limit import (
    limiter,
    AUTH_LIMIT,
    AUTH_WINDOW,
    AI_LIMIT,
    AI_WINDOW,
    AI_MONTHLY_LIMIT,
)
from ai.wisdom_guardrails import enforce_wisdom_scope

JWT_SECRET = require_jwt_secret()
REVENUECAT_WEBHOOK_AUTHORIZATION = os.environ.get("REVENUECAT_WEBHOOK_AUTHORIZATION", "")
REVENUECAT_ENTITLEMENT_ID = os.environ.get("REVENUECAT_ENTITLEMENT_ID", "christcalm_premium")

app = FastAPI(title="ChristCalm API", version="1.1.0")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("christcalm")

security = HTTPBearer(auto_error=False)


class TimingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start = time.perf_counter()
        response = await call_next(request)
        ms = (time.perf_counter() - start) * 1000
        response.headers["X-Response-Time-Ms"] = f"{ms:.1f}"
        if ms > 3000:
            logger.warning("slow_request path=%s ms=%.1f", request.url.path, ms)
        return response


# Static catalog paths — safe to cache (seed data, not user-specific)
_CACHEABLE_PREFIXES = (
    "/api/emotions",
    "/api/meditations",
    "/api/prayers",
    "/api/devotional",
    "/api/wisdom/status",
)


class CatalogCacheMiddleware(BaseHTTPMiddleware):
    """DIY scale: Cache-Control on public catalog GETs (reduces Lambda load)."""

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        if request.method == "GET":
            path = request.url.path.rstrip("/") or "/"
            if any(path == p or path.startswith(p + "/") for p in _CACHEABLE_PREFIXES):
                # 5 min browser/CDN; clients also cache in-app
                response.headers.setdefault(
                    "Cache-Control", "public, max-age=300, stale-while-revalidate=60"
                )
        return response


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for") or request.headers.get("x-real-ip")
    if forwarded:
        return forwarded.split(",")[0].strip()[:64]
    if request.client:
        return (request.client.host or "unknown")[:64]
    return "unknown"


def _enforce_rate_limit(key: str, limit: int, window: int) -> None:
    allowed, remaining, retry = limiter.check(key, limit, window)
    if not allowed:
        raise HTTPException(
            status_code=429,
            detail="Too many requests. Please wait and try again.",
            headers={"Retry-After": str(retry), "X-RateLimit-Remaining": "0"},
        )


# ------------------- Models -------------------
class SignUpIn(BaseModel):
    name: str
    email: EmailStr
    password: str


class SignInIn(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    is_premium: bool = False
    faith_journey: Optional[str] = None
    concerns: List[str] = []
    streak: int = 0
    minutes_meditated: int = 0
    prayers_completed: int = 0


class AuthOut(BaseModel):
    token: str
    user: UserOut


class OnboardingIn(BaseModel):
    faith_journey: Optional[str] = None
    concerns: List[str] = []
    emotional_state: Optional[str] = None
    desired_support: List[str] = []
    preferred_time: Optional[str] = None
    commitment_accepted: bool = False
    commitment_date: Optional[str] = None
    first_practices_done: List[bool] = []
    display_name: Optional[str] = None


class MoodLogIn(BaseModel):
    emotion: str
    note: Optional[str] = None


class JournalIn(BaseModel):
    mood: Optional[str] = None
    content: str


class AIPrayerIn(BaseModel):
    feeling: str = Field(..., min_length=2, max_length=200)
    context: Optional[str] = Field(None, max_length=1000)


class WisdomChatIn(BaseModel):
    message: str = Field(..., min_length=2, max_length=2000)
    conversation_id: Optional[str] = None


class VoicePresignIn(BaseModel):
    """Request a presigned S3 PUT for a short voice note."""
    media_ext: str = Field(default="m4a", max_length=8)
    content_type: str = Field(default="audio/mp4", max_length=64)


class VoiceTranscribeIn(BaseModel):
    """Transcribe an uploaded voice note via Amazon Transcribe."""
    s3_key: str = Field(..., min_length=8, max_length=512)
    media_format: Optional[str] = Field(default=None, max_length=16)
    language_code: str = Field(default="en-US", max_length=16)


class MeditationCompleteIn(BaseModel):
    meditation_id: str
    minutes: int


class SubscriptionSyncIn(BaseModel):
    active: bool
    plan: Optional[str] = None


# ------------------- Auth helpers -------------------
def hash_password(pw: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", pw.encode(), salt.encode(), 100_000).hex()
    return f"pbkdf2${salt}${digest}"


def verify_password(pw: str, hashed: str) -> bool:
    if hashed.startswith("pbkdf2$"):
        _, salt, digest = hashed.split("$", 2)
        check = hashlib.pbkdf2_hmac("sha256", pw.encode(), salt.encode(), 100_000).hex()
        return secrets.compare_digest(check, digest)
    # Legacy bcrypt hashes (local dev)
    try:
        import bcrypt
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False


def create_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=30),
        "iat": datetime.now(timezone.utc),
    }
    return pyjwt.encode(payload, JWT_SECRET, algorithm="HS256")


async def get_current_user(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> dict:
    if not creds:
        raise HTTPException(status_code=401, detail="Missing auth token")
    token = creds.credentials

    if cognito_auth.cognito_enabled():
        try:
            user = await cognito_auth.resolve_user_from_bearer(token)
            if user:
                return user
        except Exception:
            raise HTTPException(status_code=401, detail="Invalid token")

    try:
        payload = pyjwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = payload["sub"]
    except pyjwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = await db.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def user_to_out(u: dict) -> UserOut:
    return UserOut(
        id=u["id"],
        name=u["name"],
        email=u["email"],
        is_premium=u.get("is_premium", False),
        faith_journey=u.get("faith_journey"),
        concerns=u.get("concerns", []),
        streak=u.get("streak", 0),
        minutes_meditated=u.get("minutes_meditated", 0),
        prayers_completed=u.get("prayers_completed", 0),
    )


@api.get("/")
async def root():
    return {
        "message": "ChristCalm API",
        "status": "ok",
        "database": "dynamodb",
        "llm_provider": os.environ.get("LLM_PROVIDER", "bedrock"),
    }


@api.get("/health")
async def health():
    """Liveness + light readiness (no secrets)."""
    return {
        "status": "ok",
        "database": "dynamodb",
        "llm_provider": os.environ.get("LLM_PROVIDER", "bedrock"),
        "time": datetime.now(timezone.utc).isoformat(),
    }


@api.get("/auth/config")
async def auth_config():
    """Public Cognito settings for the mobile app."""
    apple_svc = os.environ.get("APPLE_SERVICES_ID", "")
    apple_ok = bool(apple_svc and apple_svc not in ("", "unset"))
    domain = os.environ.get("COGNITO_DOMAIN") or ""
    return {
        "provider": "cognito" if cognito_auth.cognito_enabled() else "legacy",
        "region": os.environ.get("AWS_REGION", "us-east-1"),
        "user_pool_id": os.environ.get("COGNITO_USER_POOL_ID"),
        "client_id": os.environ.get("COGNITO_CLIENT_ID"),
        "domain": domain,
        "apple_enabled": apple_ok,
        "social_setup": {
            "apple": "ready" if apple_ok else "needs_apple_services_id_in_terraform",
            "docs": "config/auth/README.md",
        },
    }


@api.post("/auth/signup", response_model=AuthOut)
async def signup(body: SignUpIn, request: Request):
    if cognito_auth.cognito_enabled():
        raise HTTPException(
            status_code=410,
            detail="Sign-up uses AWS Cognito in the app. Update the client and try again.",
        )
    _enforce_rate_limit(f"auth:signup:{_client_ip(request)}", AUTH_LIMIT, AUTH_WINDOW)
    email = body.email.lower().strip()
    existing = await db.get_user_by_email(email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    if len(body.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    if len(body.password) > 128:
        raise HTTPException(status_code=400, detail="Password is too long")
    if len(body.name.strip()) < 1 or len(body.name) > 80:
        raise HTTPException(status_code=400, detail="Please provide a valid name")

    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        "name": body.name.strip(),
        "email": email,
        "password_hash": hash_password(body.password),
        "is_premium": False,
        "faith_journey": None,
        "concerns": [],
        "streak": 0,
        "minutes_meditated": 0,
        "prayers_completed": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.create_user(user)
    return AuthOut(token=create_token(user_id), user=user_to_out(user))


@api.post("/auth/signin", response_model=AuthOut)
async def signin(body: SignInIn, request: Request):
    if cognito_auth.cognito_enabled():
        raise HTTPException(
            status_code=410,
            detail="Sign-in uses AWS Cognito in the app. Update the client and try again.",
        )
    _enforce_rate_limit(f"auth:signin:{_client_ip(request)}", AUTH_LIMIT, AUTH_WINDOW)
    email = body.email.lower().strip()
    user = await db.get_user_by_email(email)
    if not user or not user.get("password_hash") or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return AuthOut(token=create_token(user["id"]), user=user_to_out(user))


@api.get("/auth/me", response_model=UserOut)
async def me(user: dict = Depends(get_current_user)):
    premium_until = user.get("premium_until")
    if premium_until and user.get("is_premium"):
        try:
            if datetime.fromisoformat(premium_until) < datetime.now(timezone.utc):
                user = await db.update_user(user["id"], {"is_premium": False})
        except Exception:
            pass
    return user_to_out(user)


@api.post("/auth/onboarding", response_model=UserOut)
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


@api.get("/emotions")
async def get_emotions():
    return {"emotions": EMOTIONS}


@api.get("/meditations")
async def list_meditations(emotion: Optional[str] = None):
    items = MEDITATIONS if not emotion else [m for m in MEDITATIONS if m["emotion"] == emotion]
    return {"meditations": items}


@api.get("/meditations/{med_id}")
async def get_meditation(med_id: str):
    for m in MEDITATIONS:
        if m["id"] == med_id:
            return m
    raise HTTPException(status_code=404, detail="Not found")


@api.get("/prayers")
async def list_prayers(category: Optional[str] = None):
    items = PRAYERS if not category else [p for p in PRAYERS if p["category"] == category]
    return {"prayers": items, "categories": PRAYER_CATEGORIES}


@api.get("/devotional/today")
async def daily_devotional():
    idx = datetime.now(timezone.utc).timetuple().tm_yday % len(DEVOTIONALS)
    return DEVOTIONALS[idx]


@api.post("/mood/log")
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


@api.get("/mood/history")
async def mood_history(user: dict = Depends(get_current_user)):
    return {"logs": await db.list_mood_logs(user["id"], limit=100)}


@api.post("/journal")
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


@api.get("/journal")
async def list_journal(user: dict = Depends(get_current_user)):
    return {"entries": await db.list_journal_entries(user["id"], limit=200)}


@api.post("/meditations/complete")
async def complete_meditation(body: MeditationCompleteIn, user: dict = Depends(get_current_user)):
    updated = await db.increment_user_stats(user["id"], body.minutes)
    return {"ok": True, "minutes_meditated": updated.get("minutes_meditated", 0)}


@api.get("/wisdom/status")
async def wisdom_status():
    """Public diagnostic — no secrets."""
    stats = corpus_stats()
    return {
        "ok": True,
        "model": os.environ.get("BEDROCK_MODEL_ID", "openai.gpt-oss-20b-1:0"),
        "provider": os.environ.get("LLM_PROVIDER", "bedrock"),
        **stats,
    }


@api.get("/wisdom/quota")
async def wisdom_quota(user: dict = Depends(get_current_user)):
    """Monthly AI call budget remaining for this user (100 / month UTC)."""
    return await db.get_ai_quota(user["id"], limit=AI_MONTHLY_LIMIT)


@api.post("/wisdom/chat")
async def wisdom_chat(
    body: WisdomChatIn,
    request: Request,
    user: dict = Depends(get_current_user),
):
    """Conversational wisdom: RAG over /wisdom files + Bedrock (GPT-OSS / Mistral).

    Guardrails: emotional / spiritual concerns only.
    Quota: AI_MONTHLY_LIMIT (default 100) Bedrock calls per user per UTC month.
    Blocked off-topic messages do not consume quota.
    """
    _enforce_rate_limit(f"wisdom:chat:{user['id']}", AI_LIMIT, AI_WINDOW)
    _enforce_rate_limit(f"wisdom:chat:ip:{_client_ip(request)}", AI_LIMIT * 2, AI_WINDOW)

    conversation_id = (body.conversation_id or "").strip() or str(uuid.uuid4())
    msg = body.message.strip()

    # Scope check first (no quota, no Bedrock)
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

    # Monthly quota before expensive Bedrock call
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
    # list is newest-first; rebuild chronological history
    history: list[dict] = []
    for turn in reversed(prior):
        if turn.get("user_message"):
            history.append({"role": "user", "content": turn["user_message"]})
        if turn.get("assistant_message") or turn.get("prayer"):
            history.append(
                {
                    "role": "assistant",
                    "content": turn.get("assistant_message") or turn.get("prayer") or "",
                }
            )

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

    # Second-line guardrail may still block (shouldn't count again — already counted)
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
        "prayer": result["reply"],  # legacy field for older clients
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


@api.get("/wisdom/history")
async def wisdom_history(
    user: dict = Depends(get_current_user),
    conversation_id: Optional[str] = None,
):
    turns = await db.list_wisdom_turns(user["id"], conversation_id=conversation_id, limit=50)
    return {"turns": turns}


@api.post("/wisdom/voice/presign")
async def wisdom_voice_presign(
    body: VoicePresignIn,
    request: Request,
    user: dict = Depends(get_current_user),
):
    """Presigned S3 upload for a voice note (Amazon Transcribe input)."""
    _enforce_rate_limit(f"wisdom:voice:{user['id']}", AI_LIMIT, AI_WINDOW)
    _enforce_rate_limit(f"wisdom:voice:ip:{_client_ip(request)}", AI_LIMIT * 2, AI_WINDOW)
    try:
        return create_upload_url(
            user["id"],
            media_ext=body.media_ext,
            content_type=body.content_type,
        )
    except VoiceError as e:
        raise HTTPException(status_code=e.status_code, detail=str(e))


@api.post("/wisdom/voice/transcribe")
async def wisdom_voice_transcribe(
    body: VoiceTranscribeIn,
    request: Request,
    user: dict = Depends(get_current_user),
):
    """
    Convert an uploaded voice note to text with Amazon Transcribe.
    Counts as 1 AI call toward the monthly quota (Transcribe is billable).
    Client uploads via /wisdom/voice/presign first, then posts the s3_key here.
    User reviews the text in the app and presses Send for wisdom.
    """
    _enforce_rate_limit(f"wisdom:transcribe:{user['id']}", max(2, AI_LIMIT // 2), AI_WINDOW)
    _enforce_rate_limit(
        f"wisdom:transcribe:ip:{_client_ip(request)}", max(4, AI_LIMIT), AI_WINDOW
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


@api.post("/ai/prayer")
async def generate_ai_prayer(
    body: AIPrayerIn,
    request: Request,
    user: dict = Depends(get_current_user),
):
    """Legacy alias → wisdom chat (one-shot)."""
    msg = body.feeling
    if body.context:
        msg = f"{body.feeling}. {body.context}"
    proxy = WisdomChatIn(message=msg, conversation_id=None)
    result = await wisdom_chat(proxy, request, user)
    return {
        "id": result["message_id"],
        "feeling": body.feeling,
        "context": body.context,
        "prayer": result["reply"],
        "created_at": result["created_at"],
        "conversation_id": result["conversation_id"],
    }


@api.get("/ai/prayers/history")
async def ai_prayer_history(user: dict = Depends(get_current_user)):
    items = await db.list_ai_prayers(user["id"], limit=50)
    return {"prayers": items}


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


async def _set_premium(user_id: str, active: bool, plan: Optional[str] = None, expires_at: Optional[str] = None):
    payload = {
        "is_premium": active,
        "plan": plan if active else None,
        "premium_until": expires_at if active else None,
        "subscription_provider": "revenuecat",
    }
    await db.update_user(user_id, payload)


@api.post("/subscription/sync")
async def subscription_sync(body: SubscriptionSyncIn, user: dict = Depends(get_current_user)):
    plan = body.plan if body.plan in ("monthly", "annual") else None
    await _set_premium(user["id"], body.active, plan=plan)
    return {"ok": True, "active": body.active, "plan": plan}


@api.post("/revenuecat/webhook")
async def revenuecat_webhook(request: Request):
    if REVENUECAT_WEBHOOK_AUTHORIZATION:
        auth = request.headers.get("Authorization", "")
        expected = f"Bearer {REVENUECAT_WEBHOOK_AUTHORIZATION}"
        if auth != expected and auth != REVENUECAT_WEBHOOK_AUTHORIZATION:
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


@api.get("/subscription/status")
async def subscription_status(user: dict = Depends(get_current_user)):
    fresh = await db.get_user_by_id(user["id"])
    if not fresh:
        return {"active": False, "plan": None}
    active = bool(fresh.get("is_premium"))
    premium_until = fresh.get("premium_until")
    if premium_until:
        try:
            if datetime.fromisoformat(premium_until) < datetime.now(timezone.utc):
                active = False
                await db.update_user(user["id"], {"is_premium": False})
        except Exception:
            pass
    return {"active": active, "plan": fresh.get("plan"), "premium_until": premium_until}


# ------------------- Usage analytics (DynamoDB for analysis) -------------------
class AnalyticsEventIn(BaseModel):
    name: str = Field(..., min_length=1, max_length=64)
    props: Optional[dict] = None
    ts: Optional[str] = None
    id: Optional[str] = None


class AnalyticsBatchIn(BaseModel):
    events: List[AnalyticsEventIn] = Field(..., min_length=1, max_length=100)
    platform: Optional[str] = "unknown"
    session_id: Optional[str] = None
    device_id: Optional[str] = None


async def get_optional_user(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> Optional[dict]:
    if not creds:
        return None
    if cognito_auth.cognito_enabled():
        try:
            return await cognito_auth.resolve_user_from_bearer(creds.credentials)
        except Exception:
            return None
    try:
        payload = pyjwt.decode(creds.credentials, JWT_SECRET, algorithms=["HS256"])
        user_id = payload.get("sub")
        if not user_id:
            return None
        return await db.get_user_by_id(user_id)
    except Exception:
        return None


@api.post("/analytics/events")
async def analytics_ingest(
    body: AnalyticsBatchIn,
    request: Request,
    user: Optional[dict] = Depends(get_optional_user),
):
    """
    Batch product usage events into DynamoDB for analysis.
    Auth preferred (user_id). Without auth uses device_id → anon:{id}.
    """
    # Light abuse protection
    _enforce_rate_limit(
        f"analytics:{_client_ip(request)}",
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


@api.get("/analytics/me")
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


@api.get("/analytics/summary")
async def analytics_summary(
    user: dict = Depends(get_current_user),
    days: int = Query(7, ge=1, le=30),
):
    """
    Daily rollups for analysis (last N days).
    Restricted to signed-in users; treat as internal product metrics.
    """
    # Mild rate limit so summary isn't scraped
    _enforce_rate_limit(f"analytics_summary:{user['id']}", limit=30, window=60)
    summary = await db.usage_summary_for_days(days=days)
    return summary


app.include_router(api)

_cors_origins = [o.strip() for o in os.environ.get("CORS_ORIGINS", "").split(",") if o.strip()]
# Expo web preview uses http://localhost — exp:// origins alone break browser fetch.
_dev_web_origins = [
    "http://localhost:8081",
    "http://127.0.0.1:8081",
    "http://localhost:19006",
    "http://127.0.0.1:19006",
]
_allow_origins = list(dict.fromkeys(_cors_origins + _dev_web_origins)) or ["*"]
# Security headers + timing first (outermost last in Starlette reverse order)
app.add_middleware(TimingMiddleware)
app.add_middleware(CatalogCacheMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allow_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)


