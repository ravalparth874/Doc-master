"""Rate limiting helpers built on slowapi."""

from __future__ import annotations

from fastapi import Request
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from .config import Settings, get_settings

TOOL_LIMIT = "12/minute"
CONTACT_LIMIT = "5/hour"


def build_limiter(settings: Settings) -> Limiter:
    """Create the shared limiter instance."""

    return Limiter(
        key_func=get_remote_address,
        default_limits=[settings.rate_limit],
        enabled=not settings.rate_limit_disabled,
        headers_enabled=True,
    )


async def rate_limit_handler(request: Request, exc: Exception) -> JSONResponse:
    """Return a friendly JSON body when a visitor hits a rate limit."""

    del request, exc
    return JSONResponse(
        status_code=429,
        content={"detail": "Too many requests. Please wait a minute and try again."},
    )


limiter = build_limiter(get_settings())


__all__ = [
    "CONTACT_LIMIT",
    "TOOL_LIMIT",
    "RateLimitExceeded",
    "build_limiter",
    "limiter",
    "rate_limit_handler",
]
