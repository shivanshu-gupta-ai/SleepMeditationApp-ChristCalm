"""
End-to-end API journey (happy path) against deployed backend.

Covers: Cognito signup → onboarding → content → mood → journal → meditation complete
→ subscription status → (optional) AI wisdom if Bedrock configured.
"""

import time
import uuid

import pytest
import requests

from cognito_helpers import (
    BASE_URL as BASE,
    auth_headers as auth,
    cognito_client,
    cognito_env_ready,
    signup_and_token,
    strong_password,
)

if not BASE:
    pytest.skip("EXPO_PUBLIC_BACKEND_URL not set", allow_module_level=True)


class TestE2EUserJourney:
    def test_full_api_journey(self):
        if not cognito_env_ready():
            pytest.skip("Cognito env not configured")

        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        email = f"e2e_{uuid.uuid4().hex[:12]}@christcalm.app"
        password = strong_password()
        cognito = cognito_client()
        timings = {}

        # 1 Health
        t0 = time.perf_counter()
        r = s.get(f"{BASE}/api/", timeout=20)
        timings["health_ms"] = (time.perf_counter() - t0) * 1000
        assert r.status_code == 200
        body = r.json()
        assert body.get("status") == "ok"
        llm = body.get("llm_provider", "unknown")

        # 2 Cognito signup + access token
        t0 = time.perf_counter()
        token = signup_and_token(cognito, email, password, "E2E User")
        timings["signup_ms"] = (time.perf_counter() - t0) * 1000

        me = s.get(f"{BASE}/api/auth/me", headers=auth(token), timeout=20)
        assert me.status_code == 200, me.text
        user_id = me.json()["id"]

        # 3 Re-auth via Cognito
        token2 = signup_and_token(cognito, email, password, "E2E User")
        me2 = s.get(f"{BASE}/api/auth/me", headers=auth(token2), timeout=20)
        assert me2.status_code == 200
        assert me2.json()["id"] == user_id
        token = token2

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

        # 7 Complete meditation + per-session rating (DynamoDB)
        r = s.post(
            f"{BASE}/api/meditations/complete",
            headers=auth(token),
            json={"meditation_id": med_id, "minutes": 5},
            timeout=20,
        )
        assert r.status_code == 200

        r = s.post(
            f"{BASE}/api/meditations/rate",
            headers=auth(token),
            json={"meditation_id": med_id, "stars": 4, "minutes": 5},
            timeout=20,
        )
        assert r.status_code == 200, r.text
        assert r.json().get("rating", {}).get("stars") == 4
        r = s.get(f"{BASE}/api/meditations/ratings", headers=auth(token), timeout=20)
        assert r.status_code == 200
        assert any(
            e.get("meditation_id") == med_id and e.get("stars") == 4
            for e in (r.json().get("ratings") or [])
        )

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
        q2 = s.get(f"{BASE}/api/wisdom/quota", headers=auth(token), timeout=20).json()
        assert q2.get("used") == q.get("used")

        # 9c Wisdom chat (Bedrock)
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
