"""ChristCalm — FastAPI backend (Lambda + API Gateway + DynamoDB)."""

from __future__ import annotations

import logging
import os
from pathlib import Path

from core.config import bootstrap

bootstrap()

from fastapi import APIRouter, FastAPI
from starlette.middleware.cors import CORSMiddleware

from api.middleware import CatalogCacheMiddleware, TimingMiddleware
from api.routes import (
    analytics_router,
    auth_router,
    billing_router,
    catalog_router,
    health_router,
    user_content_router,
    wisdom_router,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("christcalm")

app = FastAPI(title="ChristCalm API", version="1.2.0")
api = APIRouter(prefix="/api")

api.include_router(health_router)
api.include_router(auth_router)
api.include_router(catalog_router)
api.include_router(user_content_router)
api.include_router(wisdom_router)
api.include_router(billing_router)
api.include_router(analytics_router)

app.include_router(api)

# Local preview: serve assets/meditations/audio when running uvicorn (not on Lambda)
try:
    from fastapi.staticfiles import StaticFiles

    _assets_root = Path(__file__).resolve().parents[1] / "assets"
    if _assets_root.is_dir() and not os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
        app.mount("/media", StaticFiles(directory=str(_assets_root)), name="media")
        logger.info("Mounted local media at /media → %s", _assets_root)
except Exception as _media_err:  # pragma: no cover
    logger.warning("Local media mount skipped: %s", _media_err)

_cors_origins = [o.strip() for o in os.environ.get("CORS_ORIGINS", "").split(",") if o.strip()]
# Expo web preview uses http://localhost — exp:// origins alone break browser fetch.
_dev_web_origins = [
    "http://localhost:8081",
    "http://127.0.0.1:8081",
    "http://localhost:19006",
    "http://127.0.0.1:19006",
]
_allow_origins = list(dict.fromkeys(_cors_origins + _dev_web_origins)) or ["*"]
# Security headers + timing first (outermost last in Starlette reverse order)
app.add_middleware(TimingMiddleware)
app.add_middleware(CatalogCacheMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allow_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)
