"""Export every page of a PDF as an image, packed in a ZIP archive."""

from __future__ import annotations

from fastapi import APIRouter, Request

from ..config import get_settings
from ..exceptions import AppError
from ..rate_limit import TOOL_LIMIT, limiter
from ..services.pdf_service import pdf_to_images, zip_entries
from ..services.uploads import parse_multipart
from ..services.validation import ensure_pdf
from .responses import zip_response

router = APIRouter(prefix="/api", tags=["images"])


@router.post("/pdf-to-images", summary="PDF to images")
@limiter.limit(TOOL_LIMIT)
async def pdf_to_images_endpoint(request: Request):
    """Render each page to a JPG or PNG file and return a ZIP archive."""

    settings = get_settings()
    form = await parse_multipart(request, settings)
    upload = form.files[0]
    ensure_pdf(upload.data, settings)

    image_format = form.field("format", "jpeg").lower()
    if image_format not in {"jpeg", "png"}:
        raise AppError("Choose JPG or PNG as the image format.")

    quality_raw = form.field("quality", "85")
    try:
        quality = int(quality_raw)
    except ValueError:
        quality = 85
    if not 30 <= quality <= 95:
        raise AppError("Image quality must be between 30 and 95.")

    entries = pdf_to_images(upload.data, image_format, quality)
    if len(entries) > settings.max_pages_per_pdf:
        raise AppError(f"This PDF has more than {settings.max_pages_per_pdf} pages.")

    archive = zip_entries(entries)
    return zip_response(archive, "pdf-images.zip")
