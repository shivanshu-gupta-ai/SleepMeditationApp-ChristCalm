"""Cognito auth integration tests against deployed API + User Pool."""

import uuid

import pytest
import requests

from cognito_helpers import (
    BASE_URL,
    CLIENT_ID,
    POOL_ID,
    auth_headers,
    cognito_client,
    cognito_env_ready,
    signup_and_token,
    strong_password,
)

pytestmark = pytest.mark.skipif(
    not cognito_env_ready(),
    reason="Set EXPO_PUBLIC_BACKEND_URL and Cognito env vars (sync-env-from-aws.sh)",
)


@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def cognito():
    return cognito_client()


class TestCognitoConfig:
    def test_auth_config_returns_cognito(self, session):
        r = session.get(f"{BASE_URL}/api/auth/config", timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["provider"] == "cognito"
        assert data["user_pool_id"] == POOL_ID
        assert data["client_id"] == CLIENT_ID
        assert "domain" in data

    def test_server_signup_removed(self, session):
        r = session.post(
            f"{BASE_URL}/api/auth/signup",
            json={
                "name": "X",
                "email": f"x_{uuid.uuid4().hex[:6]}@christcalm.app",
                "password": "Password1",
            },
            timeout=15,
        )
        assert r.status_code == 404, r.text

    def test_server_signin_removed(self, session):
        r = session.post(
            f"{BASE_URL}/api/auth/signin",
            json={"email": "test@christcalm.app", "password": "Password1"},
            timeout=15,
        )
        assert r.status_code == 404, r.text


class TestCognitoBearer:
    def test_cognito_access_token_me(self, session, cognito):
        email = f"cognito_{uuid.uuid4().hex[:10]}@christcalm.app"
        password = strong_password()
        token = signup_and_token(cognito, email, password, name="Cognito Tester")

        me = session.get(
            f"{BASE_URL}/api/auth/me",
            headers=auth_headers(token),
            timeout=20,
        )
        assert me.status_code == 200, me.text
        body = me.json()
        assert body["email"] == email
        assert body["name"] == "Cognito Tester"

    def test_invalid_cognito_token_rejected(self, session):
        r = session.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": "Bearer not-a-valid-cognito-token"},
            timeout=15,
        )
        assert r.status_code == 401, r.text
