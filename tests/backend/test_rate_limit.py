"""Unit tests for in-process rate limiter."""

import os
import time

# Force memory backend for unit tests (no Dynamo)
os.environ["RATE_LIMIT_BACKEND"] = "memory"

from backend_path import ensure_backend_path  # noqa: F401 — path setup

from services.rate_limit import InMemoryRateLimiter, RateLimiter


def test_allows_under_limit():
    lim = InMemoryRateLimiter()
    remaining = 0
    for _ in range(5):
        ok, remaining, retry = lim.check("u1", limit=5, window_sec=60)
        assert ok is True
        assert retry == 0
    assert remaining == 0


def test_blocks_over_limit():
    lim = InMemoryRateLimiter()
    key = "burst"
    for _ in range(3):
        lim.check(key, limit=3, window_sec=60)
    ok, remaining, retry = lim.check(key, limit=3, window_sec=60)
    assert ok is False
    assert remaining == 0
    assert retry >= 1


def test_window_expiry():
    lim = InMemoryRateLimiter()
    key = "expire"
    lim.check(key, limit=1, window_sec=1)
    ok, _, _ = lim.check(key, limit=1, window_sec=1)
    assert ok is False
    time.sleep(1.1)
    ok2, _, _ = lim.check(key, limit=1, window_sec=1)
    assert ok2 is True


def test_facade_memory_backend():
    lim = RateLimiter()
    assert lim.backend == "memory"
    ok, rem, _ = lim.check("facade", limit=2, window_sec=60)
    assert ok and rem == 1
