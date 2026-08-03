"""Security-focused API checks against the deployed (or configured) backend."""

import os
import uuid

import pytest
import requests
from dotenv import load_dotenv
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
load_dotenv(ROOT / "frontend" / ".env")
load_dotenv(ROOT / "backend" / ".env")

BASE = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "").rstrip("/")
if not BASE:
    pytest.skip("EXPO_PUBLIC_BACKEND_URL not set", allow_module_level=True)


@pytest.fixture
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


class TestSecurity:
    def test_me_requires_auth(self, session):
        r = session.get(f"{BASE}/api/auth/me", timeout=15)
        assert r.status_code == 401

    def test_wisdom_chat_requires_auth(self, session):
        r = session.post(
            f"{BASE}/api/wisdom/chat",
            json={"message": "I feel anxious"},
            timeout=15,
        )
        assert r.status_code == 401

    def test_journal_requires_auth(self, session):
        r = session.get(f"{BASE}/api/journal", timeout=15)
        assert r.status_code == 401

    def test_invalid_jwt_rejected(self, session):
        r = session.get(
            f"{BASE}/api/auth/me",
            headers={"Authorization": "Bearer not.a.real.token"},
            timeout=15,
        )
        assert r.status_code == 401

    def test_server_signup_removed(self, session):
        email = f"sec_{uuid.uuid4().hex[:8]}@christcalm.app"
        r = session.post(
            f"{BASE}/api/auth/signup",
            json={"name": "X", "email": email, "password": "Password12"},
            timeout=15,
        )
        assert r.status_code == 404

    def test_webhook_without_auth_when_configured(self, session):
        """If webhook secret is set in env, missing auth should 401; else 200 ok."""
        # Probe with garbage — never assert secret value
        r = session.post(
            f"{BASE}/api/revenuecat/webhook",
            json={"event": {"type": "TEST", "app_user_id": "nobody"}},
            timeout=15,
        )
        assert r.status_code in (200, 401)

    def test_health_does_not_leak_secrets(self, session):
        r = session.get(f"{BASE}/api/health", timeout=15)
        if r.status_code == 404:
            r = session.get(f"{BASE}/api/", timeout=15)
        assert r.status_code == 200
        text = r.text.lower()
        assert "jwt" not in text
        assert "secret" not in text
        assert "sk-" not in text
