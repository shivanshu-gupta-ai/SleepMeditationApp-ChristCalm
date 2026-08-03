"""ChristCalm backend integration tests.

Runs against the public preview URL (EXPO_PUBLIC_BACKEND_URL).
Auth uses Cognito only (no server-side email/password signup).
"""

import uuid
from pathlib import Path

import pytest
import requests
from dotenv import load_dotenv

from cognito_helpers import (
    BASE_URL,
    CLIENT_ID,
    SEEDED_EMAIL,
    SEEDED_PASSWORD,
    auth_headers as auth,
    cognito_client,
    require_cognito_env,
    signup_and_token,
    strong_password,
)

ROOT = Path(__file__).resolve().parents[2]
load_dotenv(ROOT / "frontend" / ".env")
load_dotenv(ROOT / "backend" / ".env")

if not BASE_URL:
    pytest.skip("EXPO_PUBLIC_BACKEND_URL must be set in frontend/.env", allow_module_level=True)


# -------------------- Fixtures --------------------
@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def cognito():
    require_cognito_env()
    return cognito_client()


@pytest.fixture(scope="session")
def seeded_token(cognito):
    """Access token for seeded test user (or create if missing)."""
    return signup_and_token(cognito, SEEDED_EMAIL, SEEDED_PASSWORD, "Seed Tester")


@pytest.fixture(scope="session")
def fresh_user(cognito):
    """A brand-new Cognito user for isolated tests."""
    email = f"test_{uuid.uuid4().hex[:10]}@christcalm.app"
    password = strong_password()
    token = signup_and_token(cognito, email, password, "TEST User")
    return {"email": email, "password": password, "token": token}


# -------------------- Health --------------------
class TestHealth:
    def test_root(self, session):
        r = session.get(f"{BASE_URL}/api/", timeout=15)
        assert r.status_code == 200
        assert r.json().get("status") == "ok"


# -------------------- Auth --------------------
class TestAuth:
    def test_signup_and_me(self, session, cognito):
        email = f"test_{uuid.uuid4().hex[:8]}@christcalm.app"
        password = strong_password()
        token = signup_and_token(cognito, email, password, "Signup Test")

        me = session.get(f"{BASE_URL}/api/auth/me", headers=auth(token), timeout=15)
        assert me.status_code == 200, me.text
        body = me.json()
        assert body["email"] == email.lower()
        assert body["is_premium"] is False

    def test_signup_duplicate_rejected(self, session, cognito, fresh_user):
        from botocore.exceptions import ClientError

        with pytest.raises(ClientError) as exc_info:
            cognito.sign_up(
                ClientId=CLIENT_ID,
                Username=fresh_user["email"],
                Password=strong_password(),
                UserAttributes=[{"Name": "name", "Value": "Dup"}],
            )
        assert exc_info.value.response["Error"]["Code"] == "UsernameExistsException"

    def test_signup_short_password(self, session, cognito):
        from botocore.exceptions import ClientError

        email = f"test_{uuid.uuid4().hex[:8]}@christcalm.app"
        with pytest.raises(ClientError) as exc_info:
            cognito.sign_up(
                ClientId=CLIENT_ID,
                Username=email,
                Password="123",
                UserAttributes=[{"Name": "name", "Value": "Short"}],
            )
        code = exc_info.value.response["Error"]["Code"]
        assert code in ("InvalidPasswordException", "InvalidParameterException")

    def test_signin_success(self, session, seeded_token):
        assert seeded_token

    def test_signin_bad_password(self, session, cognito):
        from botocore.exceptions import ClientError

        with pytest.raises(ClientError) as exc_info:
            cognito.initiate_auth(
                ClientId=CLIENT_ID,
                AuthFlow="USER_PASSWORD_AUTH",
                AuthParameters={"USERNAME": SEEDED_EMAIL, "PASSWORD": "wrongpass"},
            )
        assert exc_info.value.response["Error"]["Code"] in (
            "NotAuthorizedException",
            "UserNotFoundException",
        )

    def test_me_without_token(self, session):
        r = session.get(f"{BASE_URL}/api/auth/me", timeout=10)
        assert r.status_code == 401

    def test_server_signup_removed(self, session):
        """Email/password auth is Cognito-only — API has no signup route."""
        r = session.post(
            f"{BASE_URL}/api/auth/signup",
            json={
                "name": "X",
                "email": f"x_{uuid.uuid4().hex[:6]}@christcalm.app",
                "password": "Password1",
            },
            timeout=15,
        )
        assert r.status_code == 404


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
            json={"meditation_id": "med-anxious-shanti", "minutes": 7},
            timeout=15,
        )
        assert r.status_code == 200, r.text
        assert r.json()["minutes_meditated"] == start_min + 7

        me2 = session.get(
            f"{BASE_URL}/api/auth/me", headers=auth(fresh_user["token"]), timeout=15
        ).json()
        assert me2["minutes_meditated"] == start_min + 7

    def test_rating_persists_per_user(self, session, fresh_user):
        """Each session rating is stored in DynamoDB for the authenticated user."""
        me = session.get(
            f"{BASE_URL}/api/auth/me", headers=auth(fresh_user["token"]), timeout=15
        )
        assert me.status_code == 200, me.text
        user_id = me.json()["id"]

        r = session.post(
            f"{BASE_URL}/api/meditations/rate",
            headers=auth(fresh_user["token"]),
            json={"meditation_id": "med-anxious-shanti", "stars": 5, "minutes": 7},
            timeout=15,
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert body.get("ok") is True
        rating = body.get("rating") or {}
        assert rating.get("meditation_id") == "med-anxious-shanti"
        assert rating.get("stars") == 5
        assert rating.get("user_id") == user_id
        assert rating.get("id")

        listed = session.get(
            f"{BASE_URL}/api/meditations/ratings",
            headers=auth(fresh_user["token"]),
            timeout=15,
        )
        assert listed.status_code == 200, listed.text
        ratings = listed.json().get("ratings") or []
        assert any(
            x.get("id") == rating["id"] and x.get("stars") == 5 for x in ratings
        )

    def test_rating_requires_auth(self, session):
        r = session.post(
            f"{BASE_URL}/api/meditations/rate",
            json={"meditation_id": "med-anxious-shanti", "stars": 4},
            timeout=10,
        )
        assert r.status_code == 401

    def test_rating_validates_stars(self, session, fresh_user):
        r = session.post(
            f"{BASE_URL}/api/meditations/rate",
            headers=auth(fresh_user["token"]),
            json={"meditation_id": "med-anxious-shanti", "stars": 9},
            timeout=15,
        )
        assert r.status_code == 422


# -------------------- Product feedback (Me tab) --------------------
class TestFeedback:
    def test_submit_and_list_feedback(self, session, fresh_user):
        r = session.post(
            f"{BASE_URL}/api/feedback",
            headers=auth(fresh_user["token"]),
            json={
                "category": "suggestion",
                "message": "Please add evening calm reminders.",
                "stars": 5,
                "platform": "ios",
            },
            timeout=15,
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert body.get("ok") is True
        fb = body.get("feedback") or {}
        assert fb.get("category") == "suggestion"
        assert fb.get("stars") == 5
        assert fb.get("id")

        listed = session.get(
            f"{BASE_URL}/api/feedback",
            headers=auth(fresh_user["token"]),
            timeout=15,
        )
        assert listed.status_code == 200, listed.text
        items = listed.json().get("items") or []
        assert any(i.get("id") == fb["id"] for i in items)
        # free-text returned on list for the owner
        match = next(i for i in items if i.get("id") == fb["id"])
        assert "evening calm" in (match.get("message") or "")

    def test_feedback_requires_auth(self, session):
        r = session.post(
            f"{BASE_URL}/api/feedback",
            json={"category": "praise", "message": "Thank you for this app"},
            timeout=10,
        )
        assert r.status_code == 401

    def test_feedback_rejects_bad_category(self, session, fresh_user):
        r = session.post(
            f"{BASE_URL}/api/feedback",
            headers=auth(fresh_user["token"]),
            json={"category": "spam", "message": "hello world here"},
            timeout=15,
        )
        assert r.status_code == 422


# -------------------- Wisdom --------------------
class TestWisdom:
    def test_wisdom_chat(self, session, seeded_token):
        r = session.post(
            f"{BASE_URL}/api/wisdom/chat",
            headers=auth(seeded_token),
            json={"message": "I feel anxious about a work deadline."},
            timeout=90,
        )
        assert r.status_code in (200, 503, 429), r.text
        if r.status_code == 200:
            body = r.json()
            assert "reply" in body and isinstance(body["reply"], str)
            assert len(body["reply"]) > 20, f"Reply too short: {body['reply']!r}"
            assert "sk-" not in r.text
        else:
            detail = str(r.json().get("detail", "")).lower()
            assert "sk-" not in detail
            assert "api key" not in detail

    def test_wisdom_requires_auth(self, session):
        r = session.post(
            f"{BASE_URL}/api/wisdom/chat",
            json={"message": "I feel sad today."},
            timeout=10,
        )
        assert r.status_code == 401

    def test_legacy_ai_prayer_removed(self, session, seeded_token):
        r = session.post(
            f"{BASE_URL}/api/ai/prayer",
            headers=auth(seeded_token),
            json={"feeling": "anxious"},
            timeout=15,
        )
        assert r.status_code == 404


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
