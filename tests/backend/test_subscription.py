"""Subscription endpoints (RevenueCat sync + status)."""

import os
import uuid

import pytest
import requests

BASE_URL = os.environ.get("CHRISTCALM_API_URL", "").rstrip("/") + "/api"
if not BASE_URL.startswith("http"):
    BASE_URL = ""


def _skip_if_no_api():
    if not BASE_URL:
        pytest.skip("CHRISTCALM_API_URL not set")


def auth(token: str):
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def fresh_user():
    _skip_if_no_api()
    email = f"sub-{uuid.uuid4().hex[:8]}@christcalm.dev"
    r = requests.post(
        f"{BASE_URL}/auth/signup",
        json={"name": "Sub Test", "email": email, "password": "password123"},
        timeout=20,
    )
    assert r.status_code == 200, r.text
    body = r.json()
    return body["token"], body["user"]["id"]


class TestSubscription:
    def test_status_fresh_user(self, fresh_user):
        token, _ = fresh_user
        r = requests.get(f"{BASE_URL}/subscription/status", headers=auth(token), timeout=15)
        assert r.status_code == 200
        body = r.json()
        assert body.get("active") is False

    def test_sync_activate(self, fresh_user):
        token, user_id = fresh_user
        r = requests.post(
            f"{BASE_URL}/subscription/sync",
            headers=auth(token),
            json={"active": True, "plan": "annual"},
            timeout=15,
        )
        assert r.status_code == 200, r.text
        assert r.json().get("active") is True

        me = requests.get(f"{BASE_URL}/auth/me", headers=auth(token), timeout=15)
        assert me.status_code == 200
        assert me.json().get("is_premium") is True
        assert me.json().get("id") == user_id