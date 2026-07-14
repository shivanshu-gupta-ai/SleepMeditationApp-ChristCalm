"""Cognito auth integration tests against deployed API + User Pool."""

import os
import uuid
from pathlib import Path

import boto3
import pytest
import requests
from botocore.exceptions import ClientError
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[2]
load_dotenv(ROOT / "frontend" / ".env")
load_dotenv(ROOT / "backend" / ".env")

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "").rstrip("/")
POOL_ID = os.environ.get("EXPO_PUBLIC_COGNITO_USER_POOL_ID", "")
CLIENT_ID = os.environ.get("EXPO_PUBLIC_COGNITO_CLIENT_ID", "")
REGION = os.environ.get("EXPO_PUBLIC_COGNITO_REGION", "us-east-1")

pytestmark = pytest.mark.skipif(
    not BASE_URL or not POOL_ID or not CLIENT_ID,
    reason="Set EXPO_PUBLIC_BACKEND_URL and Cognito env vars (sync-env-from-aws.sh)",
)


@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def cognito():
    return boto3.client("cognito-idp", region_name=REGION)


def _strong_password() -> str:
    return f"TestPass{uuid.uuid4().hex[:4]}1"


def _signup_and_token(cognito, email: str, password: str, name: str = "Cognito Tester"):
    try:
        cognito.sign_up(
            ClientId=CLIENT_ID,
            Username=email,
            Password=password,
            UserAttributes=[{"Name": "name", "Value": name}],
        )
    except ClientError as e:
        if e.response["Error"]["Code"] != "UsernameExistsException":
            raise

    auth = cognito.initiate_auth(
        ClientId=CLIENT_ID,
        AuthFlow="USER_PASSWORD_AUTH",
        AuthParameters={"USERNAME": email, "PASSWORD": password},
    )
    return auth["AuthenticationResult"]["AccessToken"]


class TestCognitoConfig:
    def test_auth_config_returns_cognito(self, session):
        r = session.get(f"{BASE_URL}/api/auth/config", timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["provider"] == "cognito"
        assert data["user_pool_id"] == POOL_ID
        assert data["client_id"] == CLIENT_ID
        assert "domain" in data

    def test_legacy_signup_returns_410(self, session):
        r = session.post(
            f"{BASE_URL}/api/auth/signup",
            json={"name": "X", "email": f"x_{uuid.uuid4().hex[:6]}@christcalm.app", "password": "Password1"},
            timeout=15,
        )
        assert r.status_code == 410, r.text

    def test_legacy_signin_returns_410(self, session):
        r = session.post(
            f"{BASE_URL}/api/auth/signin",
            json={"email": "test@christcalm.app", "password": "Password1"},
            timeout=15,
        )
        assert r.status_code == 410, r.text


class TestCognitoBearer:
    def test_cognito_access_token_me(self, session, cognito):
        email = f"cognito_{uuid.uuid4().hex[:10]}@christcalm.app"
        password = _strong_password()
        token = _signup_and_token(cognito, email, password)

        me = session.get(
            f"{BASE_URL}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"},
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