"""Latency / performance smoke tests against live API."""

import os
import statistics
import time
import uuid

import pytest
import requests
from dotenv import load_dotenv
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
load_dotenv(ROOT / "frontend" / ".env")
load_dotenv(ROOT / "backend" / ".env")

BASE = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "").rstrip("/")
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
        # Allow cold starts; median of 5 should be well under 3s on warm API
        assert p50 < 3000, f"emotions p50 too slow: {p50:.0f}ms times={times}"

    def test_health_and_header(self):
        s = requests.Session()
        r, ms, server_ms = _timed_get(s, "/api/")
        assert r.status_code == 200
        # Prefer server header when deployed with TimingMiddleware
        assert ms < 5000

    def test_auth_flow_budget(self):
        s = requests.Session()
        s.headers.update({"Content-Type": "application/json"})
        email = f"perf_{uuid.uuid4().hex[:10]}@christcalm.app"
        t0 = time.perf_counter()
        r = s.post(
            f"{BASE}/api/auth/signup",
            json={"name": "Perf", "email": email, "password": "password123"},
            timeout=30,
        )
        signup_ms = (time.perf_counter() - t0) * 1000
        assert r.status_code == 200, r.text
        token = r.json()["token"]
        t1 = time.perf_counter()
        me = s.get(
            f"{BASE}/api/auth/me",
            headers={"Authorization": f"Bearer {token}"},
            timeout=20,
        )
        me_ms = (time.perf_counter() - t1) * 1000
        assert me.status_code == 200
        # DynamoDB + Lambda cold start can be multi-second; fail only if extreme
        assert signup_ms < 15000, f"signup {signup_ms:.0f}ms"
        assert me_ms < 8000, f"me {me_ms:.0f}ms"
