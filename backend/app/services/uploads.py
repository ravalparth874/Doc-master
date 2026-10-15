"""Strictly in-memory multipart handling.

Starlette's default ``UploadFile`` spools anything larger than 1 MB to a
temporary file on disk. DOC Master promises that user files never touch the
disk, so uploads are read straight into RAM and parsed here with the standard
library MIME parser.
"""

from __future__ import annotations

from dataclasses import dataclass
from email.parser import BytesParser
from email.policy import compat32

from fastapi import Request

from ..config import Settings
from ..exceptions import AppError, too_large

_EMPTY = b""


@dataclass(frozen=True, slots=True)
class UploadedFile:
    """A single uploaded document held in memory.

    ``filename`` is kept for display inside the browser only; the backend never
    logs it and never writes it anywhere.
    """

    filename: str
    content_type: str
    data: bytes

    @property
    def size(self) -> int:
        """Size of the upload in bytes."""

        return len(self.data)


@dataclass(frozen=True, slots=True)
class ParsedForm:
    """Result of parsing a ``multipart/form-data`` request body."""

    fields: dict[str, str]
    files: list[UploadedFile]

    def field(self, name: str, default: str = "") -> str:
        """Return an optional text field."""

        return self.fields.get(name, default).strip()

    def file_list(self, name: str = "files") -> list[UploadedFile]:
        """Return every uploaded file, whatever the field name used."""

        return list(self.files)


async def read_body(request: Request, settings: Settings) -> bytes:
    """Read the request body into memory while enforcing a hard size ceiling."""

    limit = settings.max_total_bytes
    declared = request.headers.get("content-length")
    if declared and declared.isdigit() and int(declared) > limit:
        raise too_large(
            f"Your upload is too large. The limit for one request is "
            f"{int(settings.max_total_mb)} MB."
        )

    chunks: list[bytes] = []
    total = 0
    async for chunk in request.stream():
        total += len(chunk)
        if total > limit:
            raise too_large(
                f"Your upload is too large. The limit for one request is "
                f"{int(settings.max_total_mb)} MB."
            )
        chunks.append(chunk)
    return b"".join(chunks)


async def parse_multipart(request: Request, settings: Settings) -> ParsedForm:
    """Parse a ``multipart/form-data`` body entirely in memory."""

    content_type = request.headers.get("content-type", "")
    if "multipart/form-data" not in content_type.lower():
        raise AppError("Please send the files as a form upload.")

    body = await read_body(request, settings)
    if not body:
        raise AppError("No files were uploaded. Please choose a file first.")

    message = BytesParser(policy=compat32).parsebytes(
        b"Content-Type: "
        + content_type.encode("latin-1", errors="ignore")
        + b"\r\nMIME-Version: 1.0\r\n\r\n"
        + body
    )
    if not message.is_multipart():
        raise AppError("The upload could not be read. Please try again.")

    fields: dict[str, str] = {}
    files: list[UploadedFile] = []

    for part in message.get_payload():
        if not part.is_multipart():
            disposition = str(part.get("Content-Disposition", ""))
            name = _disposition_param(disposition, "name")
            filename = _disposition_param(disposition, "filename")
            payload = part.get_payload(decode=True)
            if payload is None:
                payload = _EMPTY

            if filename is not None:
                files.append(
                    UploadedFile(
                        filename=filename or "upload",
                        content_type=(part.get_content_type() or "").lower(),
                        data=payload,
                    )
                )
            elif name:
                fields[name] = payload.decode("utf-8", errors="replace")

    if not files:
        raise AppError("No files were uploaded. Please choose a file first.")

    if len(files) > settings.max_files:
        raise AppError(f"You can upload up to {settings.max_files} files at a time.")

    return ParsedForm(fields=fields, files=files)


def _disposition_param(disposition: str, key: str) -> str | None:
    """Extract ``name`` or ``filename`` from a ``Content-Disposition`` header."""

    if not disposition:
        return None
    for chunk in disposition.split(";"):
        chunk = chunk.strip()
        if chunk.lower().startswith(f"{key}="):
            value = chunk[len(key) + 1 :].strip()
            if value.startswith('"') and value.endswith('"') and len(value) >= 2:
                value = value[1:-1]
            return value
    return None
