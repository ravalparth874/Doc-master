"""Entry point for Vercel's Python runtime.

Vercel services look for an ASGI application exposed as ``app`` in a module at
the root of the service (``entrypoint: "main:app"`` in ``vercel.json``). The
application itself lives in ``app/main.py``; this module keeps both the local
``uvicorn app.main:app`` workflow and the Vercel deployment pointing at the same
code.
"""

from __future__ import annotations

from app.main import app

__all__ = ["app"]

if __name__ == "__main__":  # pragma: no cover - local convenience
    import uvicorn
    from app.config import get_settings

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=get_settings().port,
        log_level="info",
    )
