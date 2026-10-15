"""DOC Master FastAPI application.

The API lives under ``/api`` and the pre-rendered React frontend is served from
the same process, so the whole product deploys as a single service.
"""

from __future__ import annotations

import logging
import re
from pathlib import Path
from urllib.parse import urlparse

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from .config import Settings, get_settings
from .exceptions import AppError
from .rate_limit import RateLimitExceeded, limiter, rate_limit_handler
from .routers import (
    compress,
    contact,
    health,
    images_to_pdf,
    merge,
    pdf_to_images,
    protect,
    rotate,
    split,
)

logger = logging.getLogger("doc_master")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

TEXT_SUFFIXES = {".html", ".xml", ".txt", ".webmanifest"}
IMMUTABLE_PREFIX = "assets/"

_settings: Settings = get_settings()

app = FastAPI(
    title="DOC Master API",
    description="Private, in-memory PDF tools.",
    version=_settings.version,
    docs_url="/api/docs",
    redoc_url=None,
    openapi_url="/api/openapi.json",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_handler)

# --- Middleware ---------------------------------------------------------------
# ``ALLOWED_ORIGINS=*`` allows any origin, which is reasonable here because the
# API is public, returns no cookies and never uses credentials. For a Vercel
# frontend, prefer ``ALLOWED_ORIGIN_REGEX=https://.*\.vercel\.app`` so preview
# deployments work without opening the API to every site on the internet.
_allow_all = "*" in _settings.allowed_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if _allow_all else list(_settings.allowed_origins),
    allow_origin_regex=None if _allow_all else _settings.allowed_origin_regex,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type"],
    max_age=600,
)

app.add_middleware(GZipMiddleware, minimum_size=800)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Attach conservative security headers to every response."""

    async def dispatch(
        self, request: Request, call_next: ASGIApp
    ) -> Response:  # pragma: no cover - exercised through the app
        response = await call_next(request)
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        response.headers.setdefault("X-Permitted-Cross-Domain-Policies", "none")
        response.headers.setdefault(
            "Permissions-Policy", "camera=(), microphone=(), geolocation=(), interest-cohort=()"
        )
        forwarded = request.headers.get("x-forwarded-proto", "")
        if request.url.scheme == "https" or forwarded == "https":
            response.headers.setdefault(
                "Strict-Transport-Security", "max-age=31536000; includeSubDomains"
            )
        return response


app.add_middleware(SecurityHeadersMiddleware)


# --- Error handling -----------------------------------------------------------
@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    """Return the friendly message an :class:`AppError` carries."""

    del request
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Turn pydantic errors into a short, readable message."""

    del request, exc
    return JSONResponse(
        status_code=400,
        content={
            "detail": "Some of the information you sent is not valid. "
            "Please check the form and try again."
        },
    )


@app.exception_handler(Exception)
async def unexpected_error_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch everything else without leaking internals to the visitor."""

    logger.error("Unhandled error while handling %s: %s", request.url.path, type(exc).__name__)
    return JSONResponse(
        status_code=500,
        content={"detail": "Something went wrong on our side. Please try again in a moment."},
    )


# --- Routes -------------------------------------------------------------------
for router in (
    health.router,
    merge.router,
    split.router,
    compress.router,
    images_to_pdf.router,
    pdf_to_images.router,
    rotate.router,
    protect.router,
    contact.router,
):
    app.include_router(router)


# --- Static frontend ----------------------------------------------------------
_text_cache: dict[str, tuple[float, str]] = {}


def _read_text(path: Path) -> str:
    """Read a small text asset, caching it until the file changes."""

    stat = path.stat()
    cached = _text_cache.get(str(path))
    if cached and cached[0] == stat.st_mtime:
        return cached[1]
    content = path.read_text(encoding="utf-8")
    _text_cache[str(path)] = (stat.st_mtime, content)
    return content


def _analytics_snippet(settings: Settings) -> str:
    """Build the optional analytics snippet from ``ANALYTICS_ID``.

    Every tag carries ``data-analytics`` so the frontend loader can see that the
    snippet is already in place and does not inject a second copy.
    """

    analytics_id = re.sub(r"[^A-Za-z0-9._-]", "", settings.analytics_id)
    if not analytics_id:
        return ""
    if analytics_id.startswith("G-"):
        return (
            '<link rel="preconnect" href="https://www.googletagmanager.com" crossorigin>'
            f"<script data-analytics async "
            f'src="https://www.googletagmanager.com/gtag/js?id={analytics_id}"></script>'
            "<script data-analytics>window.dataLayer=window.dataLayer||[];"
            "function gtag(){dataLayer.push(arguments)}"
            'gtag("js",new Date());'
            f'gtag("config","{analytics_id}");</script>'
        )
    host = urlparse(settings.site_url).netloc or "localhost"
    domain = analytics_id if "." in analytics_id else host
    return (
        '<link rel="preconnect" href="https://plausible.io" crossorigin>'
        f'<script data-analytics defer data-domain="{domain}" '
        'src="https://plausible.io/js/script.js"></script>'
    )


def _decorate(content: str, settings: Settings) -> str:
    """Replace the build-time origin token and inject the analytics snippet."""

    if "<!--ANALYTICS-->" in content:
        content = content.replace("<!--ANALYTICS-->", _analytics_snippet(settings))
    return content.replace(settings.token_origin, settings.site_url)


def _is_inside(candidate: Path, root: Path) -> bool:
    """Guard against path traversal in the catch-all route."""

    try:
        candidate.relative_to(root)
    except ValueError:
        return False
    return True


def _cache_control(full_path: str, suffix: str) -> str:
    """Choose a cache policy for a static asset."""

    if full_path.startswith(IMMUTABLE_PREFIX):
        return "public, max-age=31536000, immutable"
    if suffix in {".html", ".xml", ".txt"}:
        return "no-cache"
    if full_path.endswith("sw.js"):
        return "no-cache"
    return "public, max-age=604800"


def _missing_frontend_page(settings: Settings) -> HTMLResponse:
    """Explain the setup when ``dist`` is not present."""

    return HTMLResponse(
        content=(
            '<!doctype html><html lang="en"><head><meta charset="utf-8">'
            "<title>DOC Master API is running</title>"
            '<meta name="robots" content="noindex">'
            '<meta name="viewport" content="width=device-width, initial-scale=1">'
            '</head><body style="font-family:system-ui;max-width:40rem;margin:4rem auto;'
            'padding:0 1rem;line-height:1.6">'
            "<h1>DOC Master API is running</h1>"
            "<p>This server handles the PDF tools only. The interface is served "
            "separately, for example from Vercel.</p>"
            "<p>If you meant to run everything from one service, build the frontend "
            "with <code>npm install &amp;&amp; npm run build</code> inside "
            "<code>frontend/</code> so that <code>dist/</code> exists next to the API.</p>"
            "<p>The health check is at <code>/api/health</code> and the interactive "
            "documentation at <code>/api/docs</code>.</p>"
            f"<p>Looking for: <code>{settings.frontend_dist}</code></p>"
            "</body></html>"
        ),
        status_code=200,
        headers={"Cache-Control": "no-store"},
    )


@app.get("/{full_path:path}", include_in_schema=False)
async def serve_frontend(full_path: str) -> Response:
    """Serve the built frontend with SPA fallback to ``index.html``."""

    dist = _settings.frontend_dist
    if full_path.startswith("api/") or full_path == "api":
        raise HTTPException(status_code=404, detail="Endpoint not found")

    if full_path:
        candidate = (dist / full_path).resolve()
        if _is_inside(candidate, dist.resolve()):
            if candidate.is_file():
                suffix = candidate.suffix.lower()
                if suffix in TEXT_SUFFIXES:
                    return Response(
                        content=_decorate(_read_text(candidate), _settings),
                        media_type=_media_type(suffix),
                        headers={"Cache-Control": _cache_control(full_path, suffix)},
                    )
                return FileResponse(
                    candidate,
                    headers={"Cache-Control": _cache_control(full_path, suffix)},
                )
            index = candidate / "index.html"
            if index.is_file():
                return Response(
                    content=_decorate(_read_text(index), _settings),
                    media_type="text/html; charset=utf-8",
                    headers={"Cache-Control": "no-cache"},
                )

    fallback = dist / "index.html"
    if fallback.is_file():
        return Response(
            content=_decorate(_read_text(fallback), _settings),
            media_type="text/html; charset=utf-8",
            headers={"Cache-Control": "no-cache"},
        )
    return _missing_frontend_page(_settings)


def _media_type(suffix: str) -> str:
    """Map a text file suffix to a response media type."""

    return {
        ".html": "text/html; charset=utf-8",
        ".xml": "application/xml; charset=utf-8",
        ".txt": "text/plain; charset=utf-8",
        ".webmanifest": "application/manifest+json; charset=utf-8",
    }.get(suffix, "text/plain; charset=utf-8")


if __name__ == "__main__":  # pragma: no cover
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=_settings.port,
        reload=False,
        log_level="info",
    )
