"""Extra Stripe verify + URL shape checks (retest)."""
import os
import uuid
from pathlib import Path

import pytest
import requests
from dotenv import load_dotenv

load_dotenv(Path("/app/frontend/.env"))
BASE_URL = os.environ["EXPO_PUBLIC_BACKEND_URL"].rstrip("/")


def auth(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


@pytest.fixture(scope="module")
def token():
    s = requests.Session()
    email = f"TEST_{uuid.uuid4().hex[:10]}@christcalm.app"
    r = s.post(
        f"{BASE_URL}/api/auth/signup",
        json={"name": "Stripe Retest", "email": email, "password": "password123"},
        timeout=30,
    )
    assert r.status_code == 200, r.text
    return r.json()["token"]


class TestStripeRetest:
    def test_monthly_checkout_url_shape(self, token):
        r = requests.post(
            f"{BASE_URL}/api/stripe/checkout",
            headers=auth(token),
            json={"plan": "monthly", "origin_url": BASE_URL},
            timeout=30,
        )
        assert r.status_code == 200, r.text
        body = r.json()
        assert "checkout.stripe.com" in body["url"], body
        assert body["session_id"], body

    def test_annual_checkout_url_shape(self, token):
        r = requests.post(
            f"{BASE_URL}/api/stripe/checkout",
            headers=auth(token),
            json={"plan": "annual", "origin_url": BASE_URL},
            timeout=30,
        )
        assert r.status_code == 200
        body = r.json()
        assert "checkout.stripe.com" in body["url"]
        assert body["session_id"]

    def test_invalid_plan_400(self, token):
        r = requests.post(
            f"{BASE_URL}/api/stripe/checkout",
            headers=auth(token),
            json={"plan": "invalid", "origin_url": BASE_URL},
            timeout=15,
        )
        assert r.status_code == 400

    def test_verify_unpaid_session(self, token):
        # Create a session
        c = requests.post(
            f"{BASE_URL}/api/stripe/checkout",
            headers=auth(token),
            json={"plan": "monthly", "origin_url": BASE_URL},
            timeout=30,
        )
        assert c.status_code == 200
        sid = c.json()["session_id"]

        v = requests.get(
            f"{BASE_URL}/api/stripe/verify/{sid}",
            headers=auth(token),
            timeout=30,
        )
        assert v.status_code == 200, v.text
        body = v.json()
        assert body["active"] is False, body
        assert "payment_status" in body, body
        # Un-paid session should not be 'paid'
        assert body["payment_status"] != "paid", body

    def test_subscription_status_fresh(self, token):
        r = requests.get(
            f"{BASE_URL}/api/subscription/status", headers=auth(token), timeout=15
        )
        assert r.status_code == 200
        body = r.json()
        assert body["active"] is False
        assert body.get("premium_until") is None
