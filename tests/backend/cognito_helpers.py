"""Shared Cognito helpers for integration tests (preview pool + API)."""

from __future__ import annotations

import os
import uuid
from pathlib import Path

import boto3
import pytest
from botocore.exceptions import ClientError
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[2]
load_dotenv(ROOT / "frontend" / ".env")
load_dotenv(ROOT / "backend" / ".env")

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "").rstrip("/")
POOL_ID = os.environ.get("EXPO_PUBLIC_COGNITO_USER_POOL_ID", "")
CLIENT_ID = os.environ.get("EXPO_PUBLIC_COGNITO_CLIENT_ID", "")
REGION = os.environ.get("EXPO_PUBLIC_COGNITO_REGION", "us-east-1")

# Matches Cognito policy: 8+, upper, lower, number
SEEDED_EMAIL = "test@christcalm.dev"
SEEDED_PASSWORD = "Test1234"


def cognito_env_ready() -> bool:
    return bool(BASE_URL and POOL_ID and CLIENT_ID)


def require_cognito_env() -> None:
    if not cognito_env_ready():
        pytest.skip("Set EXPO_PUBLIC_BACKEND_URL + Cognito vars (./scripts/sync-env-from-aws.sh)")


def strong_password() -> str:
    return f"TestPass{uuid.uuid4().hex[:4]}1A"


def cognito_client():
    return boto3.client("cognito-idp", region_name=REGION)


def signup_and_token(
    cognito,
    email: str,
    password: str,
    name: str = "Test User",
) -> str:
    """Sign up (or reuse existing) and return Cognito access token."""
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


def auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
