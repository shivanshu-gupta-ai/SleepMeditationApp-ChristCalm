"""HTTP middleware for timing and public catalog caching."""

from __future__ import annotations

import logging
import time

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

logger = logging.getLogger("christcalm")

# Static catalog paths — safe to cache (seed data, not user-specific)
CACHEABLE_PREFIXES = (
    "/api/emotions",
    "/api/meditations",
    "/api/prayers",
    "/api/devotional",
    "/api/wisdom/status",
)


class TimingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start = time.perf_counter()
        response = await call_next(request)
        ms = (time.perf_counter() - start) * 1000
        response.headers["X-Response-Time-Ms"] = f"{ms:.1f}"
        if ms > 3000:
            logger.warning("slow_request path=%s ms=%.1f", request.url.path, ms)
        return response


class CatalogCacheMiddleware(BaseHTTPMiddleware):
    """Cache-Control on public catalog GETs (reduces Lambda load)."""

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        if request.method == "GET":
            path = request.url.path.rstrip("/") or "/"
            if any(path == p or path.startswith(p + "/") for p in CACHEABLE_PREFIXES):
                response.headers.setdefault(
                    "Cache-Control", "public, max-age=300, stale-while-revalidate=60"
                )
        return response
