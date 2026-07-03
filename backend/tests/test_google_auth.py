"""Google Auth (Emergent-managed OAuth) tests for POST /api/auth/google.

We cannot mint a real Emergent session_id in tests, so we validate structural
behavior: invalid session -> 401, missing field -> 422, and that the endpoint
exists and returns proper contract.
"""
import os
import uuid
from pathlib import Path

import pytest
import requests
from dotenv import load_dotenv

load_dotenv(Path("/app/frontend/.env"))
BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "").rstrip("/")
assert BASE_URL


@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


class TestGoogleAuth:
    def test_google_invalid_session_returns_401(self, session):
        r = session.post(
            f"{BASE_URL}/api/auth/google",
            json={"session_id": f"invalid-{uuid.uuid4().hex}"},
            timeout=30,
        )
        assert r.status_code == 401, r.text
        assert r.json().get("detail") == "Invalid Google session"

    def test_google_missing_session_id_returns_422(self, session):
        r = session.post(f"{BASE_URL}/api/auth/google", json={}, timeout=15)
        assert r.status_code == 422, r.text

    def test_google_empty_session_id_returns_401(self, session):
        # Pydantic accepts empty string for `str`; backend should reject via Emergent
        r = session.post(
            f"{BASE_URL}/api/auth/google",
            json={"session_id": ""},
            timeout=30,
        )
        assert r.status_code in (401, 400, 422), r.text

    def test_google_route_no_auth_required(self, session):
        """/auth/google must be callable without a Bearer token."""
        r = session.post(
            f"{BASE_URL}/api/auth/google",
            json={"session_id": "will-be-rejected"},
            timeout=30,
        )
        assert r.status_code != 401 or r.json().get("detail") != "Missing auth token"


# -------------------- Email/password regression --------------------
class TestEmailPasswordRegression:
    def test_seeded_signin(self, session):
        r = session.post(
            f"{BASE_URL}/api/auth/signin",
            json={"email": "test@christcalm.app", "password": "password123"},
            timeout=20,
        )
        # If seeded user doesn't exist yet, create it
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
