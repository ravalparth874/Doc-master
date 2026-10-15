"""Shared helpers for PDF tool endpoints."""

from __future__ import annotations

from urllib.parse import quote

from fastapi.responses import Response

PDF_MEDIA_TYPE = "application/pdf"
ZIP_MEDIA_TYPE = "application/zip"


def pdf_response(data: bytes, filename: str) -> Response:
    """Return a PDF as a download."""

    return Response(
        content=data,
        media_type=PDF_MEDIA_TYPE,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"; '
            f"filename*=UTF-8''{quote(filename)}",
            "Cache-Control": "no-store",
        },
    )


def zip_response(data: bytes, filename: str) -> Response:
    """Return a ZIP archive as a download."""

    return Response(
        content=data,
        media_type=ZIP_MEDIA_TYPE,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"; '
            f"filename*=UTF-8''{quote(filename)}",
            "Cache-Control": "no-store",
        },
    )
