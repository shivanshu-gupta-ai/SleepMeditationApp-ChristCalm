"""Liveness and root status."""

from __future__ import annotations

import os
from datetime import datetime, timezone

from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/")
async def root():
    return {
        "message": "ChristCalm API",
        "status": "ok",
        "database": "dynamodb",
        "llm_provider": os.environ.get("LLM_PROVIDER", "bedrock"),
    }


@router.get("/health")
async def health():
    """Liveness + light readiness (no secrets)."""
    return {
        "status": "ok",
        "database": "dynamodb",
        "llm_provider": os.environ.get("LLM_PROVIDER", "bedrock"),
        "time": datetime.now(timezone.utc).isoformat(),
    }
