"""Add or remove a PDF password."""

from __future__ import annotations

from fastapi import APIRouter, Request

from ..config import get_settings
from ..exceptions import AppError
from ..rate_limit import TOOL_LIMIT, limiter
from ..services.pdf_service import protect_pdf, unlock_pdf
from ..services.uploads import parse_multipart
from ..services.validation import ensure_password, ensure_pdf
from .responses import pdf_response

router = APIRouter(prefix="/api", tags=["security"])


@router.post("/protect", summary="Add a password to a PDF")
@limiter.limit(TOOL_LIMIT)
async def protect(request: Request):
    """Encrypt the PDF with the password the visitor chooses."""

    settings = get_settings()
    form = await parse_multipart(request, settings)
    upload = form.files[0]
    ensure_pdf(upload.data, settings)

    password = ensure_password(form.field("password"), form.field("confirm_password") or None)
    return pdf_response(protect_pdf(upload.data, password), "protected.pdf")


@router.post("/unlock", summary="Remove a PDF password")
@limiter.limit(TOOL_LIMIT)
async def unlock(request: Request):
    """Decrypt a PDF once the correct password is supplied."""

    settings = get_settings()
    form = await parse_multipart(request, settings)
    upload = form.files[0]
    ensure_pdf(upload.data, settings)

    password = form.field("password")
    if not password:
        raise AppError("Please enter the PDF password.")
    return pdf_response(unlock_pdf(upload.data, password), "unlocked.pdf")
