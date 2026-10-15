"""Compress PDFs with quality levels or a strict size target."""

from __future__ import annotations

from fastapi import APIRouter, Request

from ..config import get_settings
from ..exceptions import AppError
from ..rate_limit import TOOL_LIMIT, limiter
from ..services.pdf_service import COMPRESSION_LEVELS, compress_pdf
from ..services.uploads import parse_multipart
from ..services.validation import ensure_pdf
from .responses import pdf_response

router = APIRouter(prefix="/api", tags=["compress"])


@router.post("/compress", summary="Compress a PDF")
@limiter.limit(TOOL_LIMIT)
async def compress(request: Request):
    """Shrink a PDF to a fraction of its size, or below a target in KB."""

    settings = get_settings()
    form = await parse_multipart(request, settings)
    upload = form.files[0]
    ensure_pdf(upload.data, settings)

    level = form.field("level", "medium").lower()
    if level not in COMPRESSION_LEVELS:
        raise AppError("Choose Low, Medium or High compression.")

    target_raw = form.field("target_kb")
    target_kb: int | None = None
    if target_raw:
        try:
            target_kb = int(float(target_raw))
        except ValueError:
            raise AppError("Choose a target size of 100, 200, 500 or 1024 KB.") from None
        if target_kb <= 0:
            raise AppError("Choose a target size of 100, 200, 500 or 1024 KB.")

    return pdf_response(compress_pdf(upload.data, level, target_kb), "compressed.pdf")
