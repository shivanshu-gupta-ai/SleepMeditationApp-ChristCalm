"""
End-to-end API journey (happy path) against deployed backend.

Covers: signup → onboarding → content → mood → journal → meditation complete
→ subscription status → (optional) AI prayer if Bedrock configured.
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

BASE = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "").rstrip("/")
if not BASE:
    pytest.skip("EXPO_PUBLIC_BACKEND_URL not set", allow_module_level=True)


def auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


class TestE2EUserJourney:
    def test_full_api_journey(self):
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        email = f"e2e_{uuid.uuid4().hex[:12]}@christcalm.app"
        password = "password123"
        timings = {}

        # 1 Health
        t0 = time.perf_counter()
        r = s.get(f"{BASE}/api/", timeout=20)
        timings["health_ms"] = (time.perf_counter() - t0) * 1000
        assert r.status_code == 200
        body = r.json()
        assert body.get("status") == "ok"
        llm = body.get("llm_provider", "unknown")

        # 2 Signup
        t0 = time.perf_counter()
        r = s.post(
            f"{BASE}/api/auth/signup",
            json={"name": "E2E User", "email": email, "password": password},
            timeout=30,
        )
        timings["signup_ms"] = (time.perf_counter() - t0) * 1000
        assert r.status_code == 200, r.text
        token = r.json()["token"]
        user_id = r.json()["user"]["id"]

        # 3 Signin
        r = s.post(
            f"{BASE}/api/auth/signin",
            json={"email": email, "password": password},
            timeout=20,
        )
        assert r.status_code == 200
        assert r.json()["user"]["id"] == user_id

        # 4 Onboarding
        r = s.post(
            f"{BASE}/api/auth/onboarding",
            headers=auth(token),
            json={
                "faith_journey": "growing",
                "concerns": ["anxiety"],
                "emotional_state": "anxious",
                "desired_support": ["calm_anxiety"],
                "preferred_time": "evening",
                "display_name": "E2E",
            },
            timeout=20,
        )
        assert r.status_code == 200, r.text

        # 5 Static content
        for path in (
            "/api/emotions",
            "/api/meditations",
            "/api/meditations?emotion=anxious",
            "/api/prayers",
            "/api/devotional/today",
        ):
            r = s.get(f"{BASE}{path}", timeout=20)
            assert r.status_code == 200, path

        meds = s.get(f"{BASE}/api/meditations?emotion=anxious", timeout=20).json()["meditations"]
        assert len(meds) >= 1
        med_id = meds[0]["id"]

        # 6 Mood + journal
        r = s.post(
            f"{BASE}/api/mood/log",
            headers=auth(token),
            json={"emotion": "anxious", "note": "e2e"},
            timeout=20,
        )
        assert r.status_code == 200
        r = s.post(
            f"{BASE}/api/journal",
            headers=auth(token),
            json={"content": "E2E journal entry", "mood": "anxious"},
            timeout=20,
        )
        assert r.status_code == 200
        r = s.get(f"{BASE}/api/journal", headers=auth(token), timeout=20)
        assert r.status_code == 200
        assert any("E2E journal" in (e.get("content") or "") for e in r.json().get("entries", []))

        # 7 Complete meditation
        r = s.post(
            f"{BASE}/api/meditations/complete",
            headers=auth(token),
            json={"meditation_id": med_id, "minutes": 5},
            timeout=20,
        )
        assert r.status_code == 200

        # 8 Subscription status
        r = s.get(f"{BASE}/api/subscription/status", headers=auth(token), timeout=20)
        assert r.status_code == 200
        assert "active" in r.json()

        # 9a Monthly quota snapshot
        r = s.get(f"{BASE}/api/wisdom/quota", headers=auth(token), timeout=20)
        assert r.status_code == 200, r.text
        q = r.json()
        assert q.get("limit") == 100
        assert "remaining" in q and "used" in q

        # 9b Guardrail: off-topic must not call Bedrock as real help
        r = s.post(
            f"{BASE}/api/wisdom/chat",
            headers=auth(token),
            json={"message": "Write a Python function to reverse a linked list"},
            timeout=30,
        )
        assert r.status_code == 200, r.text
        blocked = r.json()
        assert blocked.get("blocked") is True
        assert "emotional concern" in (blocked.get("reply") or "").lower()
        # Blocked turns should not burn monthly quota
        q2 = s.get(f"{BASE}/api/wisdom/quota", headers=auth(token), timeout=20).json()
        assert q2.get("used") == q.get("used")

        # 9c Wisdom chat (Bedrock GPT-OSS / Mistral)
        t0 = time.perf_counter()
        r = s.post(
            f"{BASE}/api/wisdom/chat",
            headers=auth(token),
            json={"message": "I feel anxious about tomorrow. What would Jesus say?"},
            timeout=60,
        )
        timings["wisdom_ms"] = (time.perf_counter() - t0) * 1000
        assert r.status_code in (200, 503, 429), r.text
        if r.status_code == 200:
            body = r.json()
            assert "reply" in body and len(body["reply"]) > 20
            assert "conversation_id" in body
            assert "ai_quota" in body
            # follow-up turn (conversational)
            r2 = s.post(
                f"{BASE}/api/wisdom/chat",
                headers=auth(token),
                json={
                    "message": "I still feel heavy — can you pray with me about rest?",
                    "conversation_id": body["conversation_id"],
                },
                timeout=60,
            )
            assert r2.status_code in (200, 503, 429), r2.text

        print(
            f"\n[E2E timings] llm={llm} "
            f"health={timings['health_ms']:.0f}ms "
            f"signup={timings['signup_ms']:.0f}ms "
            f"wisdom={timings.get('wisdom_ms', 0):.0f}ms status={r.status_code}"
        )
