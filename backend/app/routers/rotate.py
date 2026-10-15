"""Rotate all pages or a selection of pages."""

from __future__ import annotations

from fastapi import APIRouter, Request

from ..config import get_settings
from ..exceptions import AppError
from ..rate_limit import TOOL_LIMIT, limiter
from ..services.pdf_service import rotate_pdf
from ..services.uploads import parse_multipart
from ..services.validation import ensure_pdf
from .responses import pdf_response

router = APIRouter(prefix="/api", tags=["rotate"])


@router.post("/rotate", summary="Rotate PDF pages")
@limiter.limit(TOOL_LIMIT)
async def rotate(request: Request):
    """Rotate the chosen pages by 90, 180 or 270 degrees clockwise."""

    settings = get_settings()
    form = await parse_multipart(request, settings)
    upload = form.files[0]
    ensure_pdf(upload.data, settings)

    degrees_raw = form.field("degrees", "90")
    try:
        degrees = int(degrees_raw)
    except ValueError:
        raise AppError("Choose a rotation of 90, 180 or 270 degrees.") from None
    if degrees not in {90, 180, 270}:
        raise AppError("Choose a rotation of 90, 180 or 270 degrees.")

    selection = form.field("pages", "all") or "all"
    return pdf_response(rotate_pdf(upload.data, degrees, selection), "rotated.pdf")
