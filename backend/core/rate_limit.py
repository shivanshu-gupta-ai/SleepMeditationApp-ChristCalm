"""Rate limiting — in-process (local) or DynamoDB (Lambda multi-instance).

RATE_LIMIT_BACKEND:
  memory  — process dict (tests / local)
  dynamo  — fixed-window counters in DynamoDB (production scale)
  auto    — dynamo if DYNAMODB_TABLE_PREFIX set, else memory
"""

from __future__ import annotations

import logging
import os
import threading
import time
from collections import defaultdict
from decimal import Decimal
from typing import DefaultDict, List, Tuple

logger = logging.getLogger("christcalm.rate_limit")


class InMemoryRateLimiter:
    """Sliding-window limiter for a single process."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._hits: DefaultDict[str, List[float]] = defaultdict(list)

    def check(self, key: str, limit: int, window_sec: int) -> Tuple[bool, int, int]:
        now = time.time()
        cutoff = now - window_sec
        with self._lock:
            hits = [t for t in self._hits[key] if t > cutoff]
            if len(hits) >= limit:
                self._hits[key] = hits
                oldest = hits[0] if hits else now
                retry = max(1, int(oldest + window_sec - now) + 1)
                return False, 0, retry
            hits.append(now)
            self._hits[key] = hits
            remaining = max(0, limit - len(hits))
            return True, remaining, 0

    def reset(self, key: str | None = None) -> None:
        with self._lock:
            if key is None:
                self._hits.clear()
            else:
                self._hits.pop(key, None)


class DynamoRateLimiter:
    """
    Fixed-window counter shared across all Lambda instances.

    Item key: pk = "{rate_key}#{window_id}"
    window_id = floor(now / window_sec)
    TTL deletes stale windows automatically.
    """

    def __init__(self) -> None:
        self._table_name = (
            f"{os.environ.get('DYNAMODB_TABLE_PREFIX', 'christcalm')}-rate-limits"
        )
        self._table = None
        self._fallback = InMemoryRateLimiter()

    def _get_table(self):
        if self._table is None:
            import boto3

            region = os.environ.get("AWS_REGION", "us-east-1")
            self._table = boto3.resource("dynamodb", region_name=region).Table(
                self._table_name
            )
        return self._table

    def check(self, key: str, limit: int, window_sec: int) -> Tuple[bool, int, int]:
        window_sec = max(1, int(window_sec))
        limit = max(1, int(limit))
        now = int(time.time())
        window_id = now // window_sec
        window_end = (window_id + 1) * window_sec
        pk = f"{key}#{window_id}"
        ttl = window_end + window_sec  # keep a little past the window

        try:
            table = self._get_table()
            resp = table.update_item(
                Key={"pk": pk},
                UpdateExpression="ADD #c :one SET #ttl = if_not_exists(#ttl, :ttl)",
                ExpressionAttributeNames={"#c": "count", "#ttl": "ttl"},
                ExpressionAttributeValues={
                    ":one": Decimal(1),
                    ":ttl": Decimal(ttl),
                },
                ReturnValues="UPDATED_NEW",
            )
            count = int(resp["Attributes"].get("count") or 1)
            if count > limit:
                retry = max(1, window_end - now)
                return False, 0, retry
            remaining = max(0, limit - count)
            return True, remaining, 0
        except Exception as e:
            # Table missing / IAM / offline → fail open to memory so app still works
            logger.warning("dynamo_rate_limit_fallback err=%s key=%s", e, key[:48])
            return self._fallback.check(key, limit, window_sec)

    def reset(self, key: str | None = None) -> None:
        self._fallback.reset(key)


def _resolve_backend() -> str:
    raw = (os.environ.get("RATE_LIMIT_BACKEND") or "auto").strip().lower()
    if raw in ("memory", "dynamo"):
        return raw
    # auto
    if os.environ.get("AWS_LAMBDA_FUNCTION_NAME") or os.environ.get(
        "DYNAMODB_TABLE_PREFIX"
    ):
        # Prefer dynamo on Lambda; still falls back to memory if table missing
        if os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
            return "dynamo"
    return "memory"


class RateLimiter:
    """Facade used by server.py — same API as before."""

    def __init__(self) -> None:
        backend = _resolve_backend()
        self.backend = backend
        if backend == "dynamo":
            self._impl: InMemoryRateLimiter | DynamoRateLimiter = DynamoRateLimiter()
        else:
            self._impl = InMemoryRateLimiter()

    def check(self, key: str, limit: int, window_sec: int) -> Tuple[bool, int, int]:
        return self._impl.check(key, limit, window_sec)

    def reset(self, key: str | None = None) -> None:
        self._impl.reset(key)


# Shared process-wide limiter
limiter = RateLimiter()

# Policy defaults (override via env)
AUTH_LIMIT = 30  # signup/signin attempts
AUTH_WINDOW = 15 * 60  # 15 minutes
AI_LIMIT = 12  # short-window burst (per hour) — monthly cap is separate
AI_WINDOW = 60 * 60  # 1 hour
# Durable monthly cap per user (enforced in DynamoDB users table)
AI_MONTHLY_LIMIT = int(os.environ.get("AI_MONTHLY_LIMIT", "100"))
API_LIMIT = 300  # general authenticated API
API_WINDOW = 60  # per minute
