"""Domain route modules mounted under /api."""

from api.routes.analytics import router as analytics_router
from api.routes.auth import router as auth_router
from api.routes.billing import router as billing_router
from api.routes.catalog import router as catalog_router
from api.routes.health import router as health_router
from api.routes.user_content import router as user_content_router
from api.routes.wisdom import router as wisdom_router

__all__ = [
    "analytics_router",
    "auth_router",
    "billing_router",
    "catalog_router",
    "health_router",
    "user_content_router",
    "wisdom_router",
]
