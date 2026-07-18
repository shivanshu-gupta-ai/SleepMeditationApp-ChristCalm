"""Subscription endpoints (RevenueCat sync + status)."""

import os
import uuid

import pytest
import requests

from cognito_helpers import (
    BASE_URL,
    auth_headers,
    cognito_client,
    cognito_env_ready,
    signup_and_token,
    strong_password,
)

# Prefer EXPO_PUBLIC_BACKEND_URL; fall back to CHRISTCALM_API_URL
API = (os.environ.get("CHRISTCALM_API_URL") or BASE_URL or "").rstrip("/")


def _skip_if_no_api():
    if not API or not cognito_env_ready():
        pytest.skip("API URL + Cognito env not set")


@pytest.fixture
def fresh_user():
    _skip_if_no_api()
    email = f"sub-{uuid.uuid4().hex[:8]}@christcalm.dev"
    password = strong_password()
    token = signup_and_token(cognito_client(), email, password, "Sub Test")
    me = requests.get(
        f"{API}/api/auth/me",
        headers=auth_headers(token),
        timeout=20,
    )
    assert me.status_code == 200, me.text
    return token, me.json()["id"]


class TestSubscription:
    def test_status_fresh_user(self, fresh_user):
        token, _ = fresh_user
        r = requests.get(
            f"{API}/api/subscription/status",
            headers=auth_headers(token),
            timeout=15,
        )
        assert r.status_code == 200
        body = r.json()
        assert body.get("active") is False

    def test_sync_activate(self, fresh_user):
        token, user_id = fresh_user
        r = requests.post(
            f"{API}/api/subscription/sync",
            headers=auth_headers(token),
            json={"active": True, "plan": "annual"},
            timeout=15,
        )
        assert r.status_code == 200, r.text
        assert r.json().get("active") is True

        me = requests.get(
            f"{API}/api/auth/me",
            headers=auth_headers(token),
            timeout=15,
        )
        assert me.status_code == 200
        assert me.json().get("is_premium") is True
        assert me.json().get("id") == user_id
