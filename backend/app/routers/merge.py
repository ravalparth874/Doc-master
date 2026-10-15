"""Merge several PDF files into one document."""

from __future__ import annotations

from fastapi import APIRouter, Request

from ..config import get_settings
from ..rate_limit import TOOL_LIMIT, limiter
from ..services.pdf_service import merge_pdfs
from ..services.uploads import parse_multipart
from ..services.validation import ensure_file_count, ensure_pdf
from .responses import pdf_response

router = APIRouter(prefix="/api", tags=["merge"])


@router.post("/merge", summary="Merge PDF files")
@limiter.limit(TOOL_LIMIT)
async def merge(request: Request):
    """Join every uploaded PDF in the order it was sent."""

    settings = get_settings()
    form = await parse_multipart(request, settings)

    ensure_file_count(len(form.files), settings)
    payloads = []
    for upload in form.files:
        ensure_pdf(upload.data, settings)
        payloads.append(upload.data)

    return pdf_response(merge_pdfs(payloads), "merged.pdf")
