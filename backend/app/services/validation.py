"""Input validation helpers.

Every uploaded file is checked before it reaches a PDF library so that the user
gets a short, friendly message instead of a library traceback.
"""

from __future__ import annotations

from ..config import Settings
from ..exceptions import AppError, too_large

PDF_MAGIC = b"%PDF-"
PNG_MAGIC = b"\x89PNG\r\n\x1a\n"
JPEG_MAGIC = b"\xff\xd8\xff"

MAX_HEADER_PROBE = 4096


def ensure_not_empty(data: bytes, label: str = "file") -> None:
    """Reject completely empty uploads."""

    if not data:
        raise AppError(f"The {label} is empty, so there is nothing to process.")


def ensure_within_size(data: bytes, settings: Settings, label: str = "file") -> None:
    """Reject uploads bigger than ``MAX_FILE_MB``."""

    limit = settings.max_file_bytes
    if len(data) > limit:
        raise too_large(
            f"This {label} is too big. Each file must be {int(settings.max_file_mb)} MB or smaller."
        )


def ensure_pdf(data: bytes, settings: Settings) -> None:
    """Validate that ``data`` looks like a non-empty PDF within the size limit."""

    ensure_not_empty(data)
    ensure_within_size(data, settings)
    if PDF_MAGIC not in data[:MAX_HEADER_PROBE]:
        raise AppError("This file is not a valid PDF. Please choose a PDF file.")


def ensure_image(data: bytes, settings: Settings) -> None:
    """Validate that ``data`` is a JPG or PNG image within the size limit."""

    ensure_not_empty(data, "image")
    ensure_within_size(data, settings, "image")
    header = data[:MAX_HEADER_PROBE]
    if PNG_MAGIC not in header and JPEG_MAGIC not in data[:3]:
        raise AppError("Only JPG and PNG images are supported.")


def ensure_file_count(count: int, settings: Settings) -> None:
    """Reject more files than the configured maximum."""

    if count > settings.max_files:
        raise AppError(f"You can upload up to {settings.max_files} files at a time.")


def parse_page_number(value: str, default: int | None = None) -> int | None:
    """Parse a positive page number coming from the API."""

    value = value.strip()
    if not value:
        if default is None:
            raise AppError("Please enter a page number.")
        return default
    try:
        number = int(value)
    except ValueError:
        raise AppError("Page numbers must be whole numbers, such as 1 or 4.") from None
    if number < 1:
        raise AppError("Page numbers start at 1.")
    return number


def parse_page_selection(spec: str, total: int) -> list[int]:
    """Parse ``all``, ``2``, ``1,4`` or ``2-5`` into zero based page indexes."""

    spec = spec.strip().lower()
    if not spec or spec == "all":
        return list(range(total))

    selected: set[int] = set()
    for chunk in spec.replace(" ", "").split(","):
        if not chunk:
            continue
        if "-" in chunk:
            start_raw, _, end_raw = chunk.partition("-")
            try:
                start, end = int(start_raw), int(end_raw)
            except ValueError:
                raise AppError("Use a page range like 2-5.") from None
            if start > end:
                start, end = end, start
            if start < 1 or end > total:
                raise AppError(f"This PDF has {total} page(s). Choose pages 1 to {total}.")
            selected.update(range(start - 1, end))
        else:
            try:
                page = int(chunk)
            except ValueError:
                raise AppError("Use pages like 1, 3 or a range like 2-5.") from None
            if page < 1 or page > total:
                raise AppError(f"This PDF has {total} page(s). Choose pages 1 to {total}.")
            selected.add(page - 1)

    if not selected:
        raise AppError("No pages were selected.")
    return sorted(selected)


def ensure_password(password: str, confirm: str | None = None) -> str:
    """Validate a user supplied PDF password."""

    if not password:
        raise AppError("Please enter a password.")
    if len(password) < 4:
        raise AppError("Use a password with at least 4 characters.")
    if len(password) > 128:
        raise AppError("Passwords must be 128 characters or fewer.")
    if confirm is not None and password != confirm:
        raise AppError("The two passwords do not match.")
    return password
