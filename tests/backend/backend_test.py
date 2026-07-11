"""ChristCalm backend integration tests.

Runs against the public preview URL exposed via EXPO_PUBLIC_BACKEND_URL.
Covers auth, onboarding, content, mood/journal, meditations completion,
AI prayer (GPT-5.2), and subscription sync.
"""

import os
import time
import uuid
from pathlib import Path

import pytest
import requests
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[2]
load_dotenv(ROOT / "frontend" / ".env")
load_dotenv(ROOT / "backend" / ".env")

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "").rstrip("/")
assert BASE_URL, "EXPO_PUBLIC_BACKEND_URL must be set in frontend/.env"

SEEDED_EMAIL = "test@christcalm.app"
SEEDED_PASSWORD = "password123"


# -------------------- Fixtures --------------------
@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def seeded_token(session):
    """Sign in seeded test user (or sign it up if missing)."""
    r = session.post(
        f"{BASE_URL}/api/auth/signin",
        json={"email": SEEDED_EMAIL, "password": SEEDED_PASSWORD},
        timeout=30,
    )
    if r.status_code == 401:
        # Register the seeded user if not present
        signup = session.post(
            f"{BASE_URL}/api/auth/signup",
            json={"name": "Seed Tester", "email": SEEDED_EMAIL, "password": SEEDED_PASSWORD},
            timeout=30,
        )
        assert signup.status_code == 200, signup.text
        return signup.json()["token"]
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="session")
def fresh_user(session):
    """A brand-new user for isolated tests (subscription-status, onboarding, etc.)"""
    email = f"TEST_{uuid.uuid4().hex[:10]}@christcalm.app"
    r = session.post(
        f"{BASE_URL}/api/auth/signup",
        json={"name": "TEST User", "email": email, "password": "password123"},
        timeout=30,
    )
    assert r.status_code == 200, r.text
    data = r.json()
    return {"email": email, "token": data["token"], "user": data["user"]}


def auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


# -------------------- Health --------------------
class TestHealth:
    def test_root(self, session):
        r = session.get(f"{BASE_URL}/api/", timeout=15)
        assert r.status_code == 200
        assert r.json().get("status") == "ok"


# -------------------- Auth --------------------
class TestAuth:
    def test_signup_and_me(self, session):
        email = f"TEST_{uuid.uuid4().hex[:8]}@christcalm.app"
        r = session.post(
            f"{BASE_URL}/api/auth/signup",
            json={"name": "Signup Test", "email": email, "password": "password123"},
            timeout=20,
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert "token" in body and "user" in body
        # Backend lowercases email
        assert body["user"]["email"] == email.lower()
        assert body["user"]["is_premium"] is False

        me = session.get(f"{BASE_URL}/api/auth/me", headers=auth(body["token"]), timeout=15)
        assert me.status_code == 200
        assert me.json()["email"] == email.lower()

    def test_signup_duplicate_rejected(self, session, fresh_user):
        r = session.post(
            f"{BASE_URL}/api/auth/signup",
            json={"name": "Dup", "email": fresh_user["email"], "password": "password123"},
            timeout=15,
        )
        assert r.status_code == 400

    def test_signup_short_password(self, session):
        email = f"TEST_{uuid.uuid4().hex[:8]}@christcalm.app"
        r = session.post(
            f"{BASE_URL}/api/auth/signup",
            json={"name": "Short", "email": email, "password": "123"},
            timeout=15,
        )
        assert r.status_code == 400

    def test_signin_success(self, session, seeded_token):
        assert seeded_token  # just ensures fixture worked

    def test_signin_bad_password(self, session):
        r = session.post(
            f"{BASE_URL}/api/auth/signin",
            json={"email": SEEDED_EMAIL, "password": "wrongpass"},
            timeout=15,
        )
        assert r.status_code == 401

    def test_me_without_token(self, session):
        r = session.get(f"{BASE_URL}/api/auth/me", timeout=10)
        assert r.status_code == 401


# -------------------- Onboarding --------------------
class TestOnboarding:
    def test_save_onboarding(self, session, fresh_user):
        r = session.post(
            f"{BASE_URL}/api/auth/onboarding",
            headers=auth(fresh_user["token"]),
            json={"faith_journey": "growing", "concerns": ["anxious", "grief"]},
            timeout=15,
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["faith_journey"] == "growing"
        assert set(body["concerns"]) == {"anxious", "grief"}

        # Verify persistence via GET /me
        me = session.get(
            f"{BASE_URL}/api/auth/me", headers=auth(fresh_user["token"]), timeout=15
        )
        assert me.status_code == 200
        assert me.json()["faith_journey"] == "growing"


# -------------------- Static content --------------------
class TestContent:
    def test_emotions(self, session):
        r = session.get(f"{BASE_URL}/api/emotions", timeout=15)
        assert r.status_code == 200
        arr = r.json().get("emotions", [])
        assert isinstance(arr, list) and len(arr) >= 3
        assert "id" in arr[0] and "label" in arr[0]

    def test_meditations_all(self, session):
        r = session.get(f"{BASE_URL}/api/meditations", timeout=15)
        assert r.status_code == 200
        meds = r.json().get("meditations", [])
        assert len(meds) > 0
        m = meds[0]
        for key in ("id", "title", "emotion", "duration_min"):
            assert key in m, f"Missing key {key}"

    def test_meditations_filter(self, session):
        r = session.get(f"{BASE_URL}/api/meditations?emotion=anxious", timeout=15)
        assert r.status_code == 200
        meds = r.json().get("meditations", [])
        assert len(meds) > 0
        assert all(m["emotion"] == "anxious" for m in meds)

    def test_meditation_by_id(self, session):
        listing = session.get(f"{BASE_URL}/api/meditations", timeout=15).json()["meditations"]
        med_id = listing[0]["id"]
        r = session.get(f"{BASE_URL}/api/meditations/{med_id}", timeout=15)
        assert r.status_code == 200
        assert r.json()["id"] == med_id

    def test_meditation_not_found(self, session):
        r = session.get(f"{BASE_URL}/api/meditations/nope-xyz", timeout=15)
        assert r.status_code == 404

    def test_prayers(self, session):
        r = session.get(f"{BASE_URL}/api/prayers", timeout=15)
        assert r.status_code == 200
        body = r.json()
        assert isinstance(body.get("prayers", []), list) and len(body["prayers"]) > 0
        assert isinstance(body.get("categories", []), list)

    def test_prayers_filter(self, session):
        r = session.get(f"{BASE_URL}/api/prayers?category=morning", timeout=15)
        assert r.status_code == 200
        prayers = r.json()["prayers"]
        assert all(p["category"] == "morning" for p in prayers)

    def test_devotional_today(self, session):
        r = session.get(f"{BASE_URL}/api/devotional/today", timeout=15)
        assert r.status_code == 200
        body = r.json()
        assert "verse" in body or "scripture" in body or "title" in body


# -------------------- Mood + Journal --------------------
class TestMoodJournal:
    def test_mood_log_and_history(self, session, fresh_user):
        r = session.post(
            f"{BASE_URL}/api/mood/log",
            headers=auth(fresh_user["token"]),
            json={"emotion": "anxious", "note": "TEST mood"},
            timeout=15,
        )
        assert r.status_code == 200 and r.json()["ok"] is True
        entry = r.json()["entry"]
        assert entry["emotion"] == "anxious"

        h = session.get(
            f"{BASE_URL}/api/mood/history", headers=auth(fresh_user["token"]), timeout=15
        )
        assert h.status_code == 200
        logs = h.json()["logs"]
        assert any(l["id"] == entry["id"] for l in logs)

    def test_journal_create_and_list(self, session, fresh_user):
        r = session.post(
            f"{BASE_URL}/api/journal",
            headers=auth(fresh_user["token"]),
            json={"mood": "grateful", "content": "TEST journal entry"},
            timeout=15,
        )
        assert r.status_code == 200 and r.json()["ok"] is True
        entry = r.json()["entry"]

        h = session.get(
            f"{BASE_URL}/api/journal", headers=auth(fresh_user["token"]), timeout=15
        )
        assert h.status_code == 200
        entries = h.json()["entries"]
        assert any(e["id"] == entry["id"] for e in entries)

    def test_mood_requires_auth(self, session):
        r = session.post(
            f"{BASE_URL}/api/mood/log", json={"emotion": "anxious"}, timeout=10
        )
        assert r.status_code == 401


# -------------------- Meditation completion --------------------
class TestMeditationCompletion:
    def test_completion_increments_minutes(self, session, fresh_user):
        me1 = session.get(
            f"{BASE_URL}/api/auth/me", headers=auth(fresh_user["token"]), timeout=15
        ).json()
        start_min = me1.get("minutes_meditated", 0)

        r = session.post(
            f"{BASE_URL}/api/meditations/complete",
            headers=auth(fresh_user["token"]),
            json={"meditation_id": "med-1", "minutes": 7},
            timeout=15,
        )
        assert r.status_code == 200, r.text
        assert r.json()["minutes_meditated"] == start_min + 7

        me2 = session.get(
            f"{BASE_URL}/api/auth/me", headers=auth(fresh_user["token"]), timeout=15
        ).json()
        assert me2["minutes_meditated"] == start_min + 7


# -------------------- AI Prayer (GPT-5.2 via emergentintegrations) --------------------
class TestAIPrayer:
    def test_generate_prayer(self, session, seeded_token):
        r = session.post(
            f"{BASE_URL}/api/ai/prayer",
            headers=auth(seeded_token),
            json={"feeling": "anxious", "context": "work deadline stress"},
            timeout=90,
        )
        # 200 = Bedrock/OpenAI OK; 503 = model not enabled / temporary; 429 = rate limited
        assert r.status_code in (200, 503, 429), r.text
        if r.status_code == 200:
            body = r.json()
            assert "prayer" in body and isinstance(body["prayer"], str)
            assert len(body["prayer"]) > 40, f"Prayer too short: {body['prayer']!r}"
            # Errors must not leak provider secrets
            assert "sk-" not in r.text
        else:
            detail = str(r.json().get("detail", "")).lower()
            assert "sk-" not in detail
            assert "api key" not in detail

    def test_prayer_requires_auth(self, session):
        r = session.post(
            f"{BASE_URL}/api/ai/prayer",
            json={"feeling": "sad"},
            timeout=10,
        )
        assert r.status_code == 401


# -------------------- Subscriptions (RevenueCat) --------------------
class TestSubscription:
    def test_subscription_status_fresh_user(self, session, fresh_user):
        r = session.get(
            f"{BASE_URL}/api/subscription/status",
            headers=auth(fresh_user["token"]),
            timeout=15,
        )
        assert r.status_code == 200
        body = r.json()
        assert body["active"] is False

    def test_subscription_sync(self, session, fresh_user):
        r = session.post(
            f"{BASE_URL}/api/subscription/sync",
            headers=auth(fresh_user["token"]),
            json={"active": True, "plan": "monthly"},
            timeout=15,
        )
        assert r.status_code == 200, r.text
        assert r.json()["active"] is True
