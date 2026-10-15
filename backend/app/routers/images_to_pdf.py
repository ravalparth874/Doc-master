"""Convert JPG and PNG images into a single PDF."""

from __future__ import annotations

from fastapi import APIRouter, Request

from ..config import get_settings
from ..exceptions import AppError
from ..rate_limit import TOOL_LIMIT, limiter
from ..services.pdf_service import images_to_pdf
from ..services.uploads import parse_multipart
from ..services.validation import ensure_file_count, ensure_image
from .responses import pdf_response

router = APIRouter(prefix="/api", tags=["images"])

PAGE_SIZES = {"a4", "letter", "original"}


@router.post("/images-to-pdf", summary="Images to PDF")
@limiter.limit(TOOL_LIMIT)
async def images_to_pdf_endpoint(request: Request):
    """Combine images into one PDF, in the order they were sent."""

    settings = get_settings()
    form = await parse_multipart(request, settings)

    ensure_file_count(len(form.files), settings)
    payloads = []
    for upload in form.files:
        ensure_image(upload.data, settings)
        payloads.append(upload.data)

    page_size = form.field("page_size", "a4").lower()
    if page_size not in PAGE_SIZES:
        raise AppError("Choose A4, Letter or Original as the page size.")

    return pdf_response(images_to_pdf(payloads, page_size), "images.pdf")
