"""Latency / performance smoke tests against live API."""

import statistics
import time
import uuid

import pytest
import requests

from cognito_helpers import (
    BASE_URL as BASE,
    auth_headers,
    cognito_client,
    cognito_env_ready,
    signup_and_token,
    strong_password,
)

if not BASE:
    pytest.skip("EXPO_PUBLIC_BACKEND_URL not set", allow_module_level=True)


def _timed_get(session, path, **kw):
    t0 = time.perf_counter()
    r = session.get(f"{BASE}{path}", timeout=kw.pop("timeout", 20), **kw)
    ms = (time.perf_counter() - t0) * 1000
    server_ms = r.headers.get("X-Response-Time-Ms")
    return r, ms, server_ms


class TestPerformance:
    def test_static_content_fast(self):
        s = requests.Session()
        times = []
        for _ in range(5):
            r, ms, _ = _timed_get(s, "/api/emotions")
            assert r.status_code == 200
            times.append(ms)
        p50 = statistics.median(times)
        assert p50 < 3000, f"emotions p50 too slow: {p50:.0f}ms times={times}"

    def test_health_and_header(self):
        s = requests.Session()
        r, ms, server_ms = _timed_get(s, "/api/")
        assert r.status_code == 200
        assert ms < 5000

    def test_auth_flow_budget(self):
        if not cognito_env_ready():
            pytest.skip("Cognito env not configured")

        s = requests.Session()
        email = f"perf_{uuid.uuid4().hex[:10]}@christcalm.app"
        password = strong_password()
        cognito = cognito_client()

        t0 = time.perf_counter()
        token = signup_and_token(cognito, email, password, "Perf")
        signup_ms = (time.perf_counter() - t0) * 1000

        t1 = time.perf_counter()
        me = s.get(
            f"{BASE}/api/auth/me",
            headers=auth_headers(token),
            timeout=20,
        )
        me_ms = (time.perf_counter() - t1) * 1000
        assert me.status_code == 200, me.text
        assert signup_ms < 15000, f"signup {signup_ms:.0f}ms"
        assert me_ms < 8000, f"me {me_ms:.0f}ms"
