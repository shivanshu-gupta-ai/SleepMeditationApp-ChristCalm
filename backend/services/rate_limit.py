"""In-process sliding-window rate limiter.

Works on a single Lambda instance / local server. For multi-instance production,
also configure API Gateway throttling (see aws/terraform). Not a substitute for
WAF at high scale.
"""

from __future__ import annotations

import threading
import time
from collections import defaultdict
from typing import DefaultDict, List, Tuple


class RateLimiter:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._hits: DefaultDict[str, List[float]] = defaultdict(list)

    def check(self, key: str, limit: int, window_sec: int) -> Tuple[bool, int, int]:
        """
        Returns (allowed, remaining, retry_after_seconds).
        """
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


# Shared process-wide limiter
limiter = RateLimiter()

# Policy defaults (override via env)
AUTH_LIMIT = 30          # signup/signin attempts
AUTH_WINDOW = 15 * 60    # 15 minutes
AI_LIMIT = 12            # short-window burst (per hour) — monthly cap is separate
AI_WINDOW = 60 * 60      # 1 hour
# Durable monthly cap per user (enforced in DynamoDB)
AI_MONTHLY_LIMIT = int(__import__("os").environ.get("AI_MONTHLY_LIMIT", "100"))
API_LIMIT = 300          # general authenticated API
API_WINDOW = 60          # per minute
