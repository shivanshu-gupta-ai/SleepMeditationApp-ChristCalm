"""ChristCalm — FastAPI backend
JWT auth + emotion-based meditations + AI prayer generator (GPT-5.2) + Stripe subscription paywall
"""
import os
import uuid
import logging
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Optional, List

import bcrypt
import jwt as pyjwt
from dotenv import load_dotenv
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr
from starlette.middleware.cors import CORSMiddleware
from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout,
    CheckoutSessionRequest,
)

from seed_data import EMOTIONS, MEDITATIONS, PRAYERS, DEVOTIONALS, PRAYER_CATEGORIES

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
JWT_SECRET = os.environ["JWT_SECRET"]
EMERGENT_LLM_KEY = os.environ["EMERGENT_LLM_KEY"]
STRIPE_API_KEY = os.environ["STRIPE_API_KEY"]

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="ChristCalm API")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("christcalm")

security = HTTPBearer(auto_error=False)


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


class MoodLogIn(BaseModel):
    emotion: str
    note: Optional[str] = None


class JournalIn(BaseModel):
    mood: Optional[str] = None
    content: str


class AIPrayerIn(BaseModel):
    feeling: str
    context: Optional[str] = None


class MeditationCompleteIn(BaseModel):
    meditation_id: str
    minutes: int


class CheckoutIn(BaseModel):
    plan: str  # "monthly" or "annual"
    origin_url: str


# ------------------- Auth helpers -------------------
def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_password(pw: str, hashed: str) -> bool:
    return bcrypt.checkpw(pw.encode(), hashed.encode())


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
    try:
        payload = pyjwt.decode(creds.credentials, JWT_SECRET, algorithms=["HS256"])
        user_id = payload["sub"]
    except pyjwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
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


# ------------------- Health -------------------
@api.get("/")
async def root():
    return {"message": "ChristCalm API", "status": "ok"}


# ------------------- Auth -------------------
@api.post("/auth/signup", response_model=AuthOut)
async def signup(body: SignUpIn):
    email = body.email.lower().strip()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    if len(body.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

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
    await db.users.insert_one(user)
    token = create_token(user_id)
    return AuthOut(token=token, user=user_to_out(user))


@api.post("/auth/signin", response_model=AuthOut)
async def signin(body: SignInIn):
    email = body.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_token(user["id"])
    return AuthOut(token=token, user=user_to_out(user))


@api.get("/auth/me", response_model=UserOut)
async def me(user: dict = Depends(get_current_user)):
    # Expire premium if premium_until is in the past
    premium_until = user.get("premium_until")
    if premium_until and user.get("is_premium"):
        try:
            if datetime.fromisoformat(premium_until) < datetime.now(timezone.utc):
                await db.users.update_one({"id": user["id"]}, {"$set": {"is_premium": False}})
                user["is_premium"] = False
        except Exception:
            pass
    return user_to_out(user)


@api.post("/auth/onboarding", response_model=UserOut)
async def save_onboarding(body: OnboardingIn, user: dict = Depends(get_current_user)):
    updates = {
        "faith_journey": body.faith_journey,
        "concerns": body.concerns,
    }
    await db.users.update_one({"id": user["id"]}, {"$set": updates})
    user.update(updates)
    return user_to_out(user)


# ------------------- Content -------------------
@api.get("/emotions")
async def get_emotions():
    return {"emotions": EMOTIONS}


@api.get("/meditations")
async def list_meditations(emotion: Optional[str] = None):
    items = MEDITATIONS
    if emotion:
        items = [m for m in items if m["emotion"] == emotion]
    return {"meditations": items}


@api.get("/meditations/{med_id}")
async def get_meditation(med_id: str):
    for m in MEDITATIONS:
        if m["id"] == med_id:
            return m
    raise HTTPException(status_code=404, detail="Not found")


@api.get("/prayers")
async def list_prayers(category: Optional[str] = None):
    items = PRAYERS
    if category:
        items = [p for p in items if p["category"] == category]
    return {"prayers": items, "categories": PRAYER_CATEGORIES}


@api.get("/devotional/today")
async def daily_devotional():
    # Rotate by day-of-year
    idx = datetime.now(timezone.utc).timetuple().tm_yday % len(DEVOTIONALS)
    return DEVOTIONALS[idx]


# ------------------- User activity -------------------
@api.post("/mood/log")
async def log_mood(body: MoodLogIn, user: dict = Depends(get_current_user)):
    entry = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "emotion": body.emotion,
        "note": body.note,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.mood_logs.insert_one(entry)
    entry.pop("_id", None)
    return {"ok": True, "entry": entry}


@api.get("/mood/history")
async def mood_history(user: dict = Depends(get_current_user)):
    docs = (
        await db.mood_logs.find({"user_id": user["id"]}, {"_id": 0})
        .sort("created_at", -1)
        .to_list(100)
    )
    return {"logs": docs}


@api.post("/journal")
async def create_journal(body: JournalIn, user: dict = Depends(get_current_user)):
    entry = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "mood": body.mood,
        "content": body.content,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.journal_entries.insert_one(entry)
    entry.pop("_id", None)
    return {"ok": True, "entry": entry}


@api.get("/journal")
async def list_journal(user: dict = Depends(get_current_user)):
    docs = (
        await db.journal_entries.find({"user_id": user["id"]}, {"_id": 0})
        .sort("created_at", -1)
        .to_list(200)
    )
    return {"entries": docs}


@api.post("/meditations/complete")
async def complete_meditation(body: MeditationCompleteIn, user: dict = Depends(get_current_user)):
    await db.users.update_one(
        {"id": user["id"]},
        {
            "$inc": {"minutes_meditated": body.minutes, "prayers_completed": 1},
            "$set": {"last_activity": datetime.now(timezone.utc).isoformat()},
        },
    )
    # simple streak: check if last log was yesterday or today
    updated = await db.users.find_one({"id": user["id"]}, {"_id": 0})
    return {"ok": True, "minutes_meditated": updated.get("minutes_meditated", 0)}


# ------------------- AI Prayer Generator -------------------
@api.post("/ai/prayer")
async def generate_prayer(body: AIPrayerIn, user: dict = Depends(get_current_user)):
    from emergentintegrations.llm.chat import LlmChat, UserMessage

    system_msg = (
        "You are a compassionate Christian pastoral companion inside a mental wellness app called ChristCalm. "
        "Given a user's feeling, craft a short, warm, scripture-anchored prayer (80-140 words). "
        "Structure: (1) A single line of scripture with reference (e.g., 'Psalm 34:18'). "
        "(2) A prayer beginning with 'Heavenly Father' or 'Lord Jesus' that acknowledges the feeling, "
        "invites God's presence, and ends with 'Amen.' Keep tone tender, not preachy. No headers or bullets."
    )

    prompt = f"Feeling: {body.feeling}."
    if body.context:
        prompt += f" Context: {body.context}."

    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"prayer-{user['id']}-{uuid.uuid4()}",
            system_message=system_msg,
        ).with_model("openai", "gpt-5.2")

        response = await chat.send_message(UserMessage(text=prompt))
        text = response if isinstance(response, str) else str(response)
    except Exception as e:
        logger.error(f"AI prayer error: {e}")
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")

    entry = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "feeling": body.feeling,
        "context": body.context,
        "prayer": text.strip(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.ai_prayers.insert_one(entry)
    entry.pop("_id", None)
    return entry


@api.get("/ai/prayers/history")
async def ai_prayer_history(user: dict = Depends(get_current_user)):
    docs = (
        await db.ai_prayers.find({"user_id": user["id"]}, {"_id": 0})
        .sort("created_at", -1)
        .to_list(50)
    )
    return {"prayers": docs}


# ------------------- Stripe Subscription (via emergentintegrations) -------------------
# NOTE: Emergent-managed Stripe test key supports only one-time payments.
# We simulate subscriptions by granting premium access for N days per purchase.
PLAN_PRICES = {
    "monthly": {"amount": 9.99, "days": 30, "label": "Monthly Premium"},
    "annual": {"amount": 59.99, "days": 365, "label": "Annual Premium"},
}


@api.post("/stripe/checkout")
async def create_checkout(body: CheckoutIn, user: dict = Depends(get_current_user)):
    if body.plan not in PLAN_PRICES:
        raise HTTPException(status_code=400, detail="Invalid plan")

    plan_cfg = PLAN_PRICES[body.plan]
    origin = body.origin_url.rstrip("/")
    checkout = StripeCheckout(api_key=STRIPE_API_KEY)

    try:
        session = await checkout.create_checkout_session(
            CheckoutSessionRequest(
                amount=float(plan_cfg["amount"]),
                currency="usd",
                success_url=f"{origin}/paywall-success?session_id={{CHECKOUT_SESSION_ID}}",
                cancel_url=f"{origin}/paywall-cancel",
                metadata={
                    "user_id": user["id"],
                    "plan": body.plan,
                    "days": str(plan_cfg["days"]),
                },
            )
        )
    except Exception as e:
        logger.error(f"Stripe checkout error: {e}")
        raise HTTPException(status_code=400, detail=f"Checkout failed: {str(e)}")

    await db.payment_transactions.update_one(
        {"session_id": session.session_id},
        {
            "$set": {
                "session_id": session.session_id,
                "user_id": user["id"],
                "email": user["email"],
                "plan": body.plan,
                "amount": plan_cfg["amount"],
                "currency": "usd",
                "days": plan_cfg["days"],
                "status": "initiated",
                "payment_status": "pending",
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
        },
        upsert=True,
    )

    return {"url": session.url, "session_id": session.session_id}


@api.get("/stripe/verify/{session_id}")
async def verify_checkout(session_id: str, user: dict = Depends(get_current_user)):
    """Poll-based confirmation used by the mobile app after redirect."""
    tx = await db.payment_transactions.find_one({"session_id": session_id})
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    checkout = StripeCheckout(api_key=STRIPE_API_KEY)
    try:
        status = await checkout.get_checkout_status(session_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    paid = status.payment_status == "paid"

    # Idempotent grant of premium
    already_granted = tx.get("payment_status") == "paid"
    if paid and not already_granted:
        days = int(status.metadata.get("days") or tx.get("days") or 30)
        premium_until = datetime.now(timezone.utc) + timedelta(days=days)
        await db.users.update_one(
            {"id": user["id"]},
            {
                "$set": {
                    "is_premium": True,
                    "premium_until": premium_until.isoformat(),
                    "plan": status.metadata.get("plan") or tx.get("plan"),
                }
            },
        )
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {
                "$set": {
                    "status": status.status,
                    "payment_status": status.payment_status,
                    "amount_total": status.amount_total,
                    "premium_until": premium_until.isoformat(),
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                }
            },
        )

    return {
        "active": paid,
        "status": status.status,
        "payment_status": status.payment_status,
        "plan": status.metadata.get("plan"),
    }


@api.get("/subscription/status")
async def subscription_status(user: dict = Depends(get_current_user)):
    fresh = await db.users.find_one({"id": user["id"]}, {"_id": 0, "password_hash": 0})
    if not fresh:
        return {"active": False, "plan": None}
    active = bool(fresh.get("is_premium"))
    premium_until = fresh.get("premium_until")
    if premium_until:
        try:
            if datetime.fromisoformat(premium_until) < datetime.now(timezone.utc):
                active = False
                await db.users.update_one(
                    {"id": user["id"]}, {"$set": {"is_premium": False}}
                )
        except Exception:
            pass
    return {"active": active, "plan": fresh.get("plan"), "premium_until": premium_until}


# ------------------- Wire router + middleware -------------------
app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown():
    client.close()
