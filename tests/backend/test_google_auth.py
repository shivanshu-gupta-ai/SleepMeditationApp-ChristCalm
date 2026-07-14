"""Legacy Google OAuth routes (deprecated — Cognito federated sign-in)."""

import os
import uuid
from pathlib import Path
import pytest
import requests
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[2]
load_dotenv(ROOT / "frontend" / ".env")
load_dotenv(ROOT / "backend" / ".env")

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "").rstrip("/")

pytestmark = pytest.mark.skipif(
    not BASE_URL,
    reason="Set EXPO_PUBLIC_BACKEND_URL to your AWS App Runner URL to run API tests",
)


@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


class TestGoogleAuth:
    def test_google_start_deprecated(self, session):
        r = session.get(
            f"{BASE_URL}/api/auth/google/start",
            params={"redirect_uri": "http://localhost:8081/oauth"},
            timeout=15,
            allow_redirects=False,
        )
        assert r.status_code == 410, r.text

    def test_google_legacy_session_returns_410(self, session):
        r = session.post(
            f"{BASE_URL}/api/auth/google",
            json={"session_id": f"invalid-{uuid.uuid4().hex}"},
            timeout=15,
        )
        assert r.status_code == 410, r.text
        assert "Cognito" in r.json().get("detail", "")