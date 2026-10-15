"""Health endpoint used by Docker, Render and uptime monitors."""

from __future__ import annotations

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from ..config import get_settings

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health", summary="Service health check")
async def health() -> JSONResponse:
    """Report that the service is up, without touching user files."""

    settings = get_settings()
    return JSONResponse(
        {
            "status": "ok",
            "service": settings.app_name,
            "version": settings.version,
        }
    )
