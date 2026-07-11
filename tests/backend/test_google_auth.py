"""Google OAuth tests for /api/auth/google/start and legacy /api/auth/google."""

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
    def test_google_start_requires_redirect_uri(self, session):
        r = session.get(f"{BASE_URL}/api/auth/google/start", timeout=15, allow_redirects=False)
        assert r.status_code == 422, r.text

    def test_google_start_invalid_redirect_returns_400(self, session):
        r = session.get(
            f"{BASE_URL}/api/auth/google/start",
            params={"redirect_uri": "https://evil.example.com"},
            timeout=15,
            allow_redirects=False,
        )
        assert r.status_code in (400, 503), r.text

    def test_google_legacy_session_returns_410(self, session):
        r = session.post(
            f"{BASE_URL}/api/auth/google",
            json={"session_id": f"invalid-{uuid.uuid4().hex}"},
            timeout=15,
        )
        assert r.status_code == 410, r.text
        assert "Emergent" in r.json().get("detail", "")

    def test_google_missing_session_id_returns_422(self, session):
        r = session.post(f"{BASE_URL}/api/auth/google", json={}, timeout=15)
        assert r.status_code == 422, r.text

    def test_google_route_no_auth_required(self, session):
        r = session.post(
            f"{BASE_URL}/api/auth/google",
            json={"session_id": "will-be-rejected"},
            timeout=15,
        )
        assert r.status_code != 401 or r.json().get("detail") != "Missing auth token"


class TestEmailPasswordRegression:
    def test_seeded_signin(self, session):
        r = session.post(
            f"{BASE_URL}/api/auth/signin",
            json={"email": "test@christcalm.app", "password": "password123"},
            timeout=20,
        )
        if r.status_code == 401:
            s = session.post(
                f"{BASE_URL}/api/auth/signup",
                json={
                    "name": "Seed Tester",
                    "email": "test@christcalm.app",
                    "password": "password123",
                },
                timeout=20,
            )
            assert s.status_code == 200, s.text
            token = s.json()["token"]
        else:
            assert r.status_code == 200, r.text
            token = r.json()["token"]

        me = session.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"},
            timeout=15,
        )
        assert me.status_code == 200
        assert me.json()["email"] == "test@christcalm.app"

    def test_signup_new_user(self, session):
        email = f"TEST_{uuid.uuid4().hex[:8]}@christcalm.app"
        r = session.post(
            f"{BASE_URL}/api/auth/signup",
            json={"name": "New User", "email": email, "password": "password123"},
            timeout=20,
        )
        assert r.status_code == 200, r.text
        assert "token" in r.json() and "user" in r.json()