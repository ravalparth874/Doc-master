"""Split a PDF by page range, or export every page as a ZIP archive."""

from __future__ import annotations

from fastapi import APIRouter, Request

from ..config import get_settings
from ..exceptions import AppError
from ..rate_limit import TOOL_LIMIT, limiter
from ..services.pdf_service import extract_pages, split_every_page, zip_entries
from ..services.uploads import parse_multipart
from ..services.validation import ensure_pdf, parse_page_number
from .responses import pdf_response, zip_response

router = APIRouter(prefix="/api", tags=["split"])


@router.post("/split", summary="Split a PDF")
@limiter.limit(TOOL_LIMIT)
async def split(request: Request):
    """Return either a page range as a new PDF or one file per page in a ZIP."""

    settings = get_settings()
    form = await parse_multipart(request, settings)
    upload = form.files[0]
    ensure_pdf(upload.data, settings)

    mode = form.field("mode", "range").lower()
    if mode not in {"range", "all"}:
        raise AppError("Choose a page range or split every page.")

    if mode == "all":
        archive = zip_entries(split_every_page(upload.data))
        return zip_response(archive, "split-pages.zip")

    start = parse_page_number(form.field("start"), default=1)
    end = parse_page_number(form.field("end"))
    assert start is not None and end is not None
    return pdf_response(extract_pages(upload.data, start, end), "split.pdf")
