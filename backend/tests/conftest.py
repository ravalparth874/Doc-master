"""Shared pytest fixtures.

The rate limiter is switched off and the upload ceiling is lowered so the test
suite stays fast and deterministic.
"""

from __future__ import annotations

import io
import os
import random

os.environ.setdefault("RATE_LIMIT_DISABLED", "1")
os.environ.setdefault("MAX_FILE_MB", "1")
os.environ.setdefault("MAX_TOTAL_MB", "20")
os.environ.setdefault("MAX_FILES", "10")

import pymupdf  # noqa: E402
import pytest  # noqa: E402
from app.main import app  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from PIL import Image  # noqa: E402


@pytest.fixture(scope="session")
def client() -> TestClient:
    """A test client bound to the ASGI application."""

    return TestClient(app)


@pytest.fixture(scope="session")
def pdf_bytes() -> bytes:
    """A single page text PDF."""

    return make_text_pdf(1)


@pytest.fixture(scope="session")
def pdf_bytes_3() -> bytes:
    """A three page text PDF."""

    return make_text_pdf(3)


def make_text_pdf(pages: int, label: str = "DOC Master test") -> bytes:
    """Build a small text based PDF with ``pages`` pages."""

    document = pymupdf.open()
    for index in range(pages):
        page = document.new_page()
        page.insert_text((72, 96), f"{label} - page {index + 1}", fontsize=14)
    data = document.tobytes()
    document.close()
    return data


def make_image_pdf(pages: int = 1, seed: int = 7) -> bytes:
    """Build a PDF made of noisy photos, which compresses poorly."""

    rng = random.Random(seed)
    buffer = io.BytesIO()
    images = []
    for _ in range(pages):
        image = Image.new("RGB", (700, 900))
        image.putdata(
            [(rng.randrange(256), rng.randrange(256), rng.randrange(256)) for _ in range(700 * 900)]
        )
        images.append(image)
    images[0].save(
        buffer,
        format="PDF",
        save_all=True,
        append_images=images[1:],
        resolution=96.0,
    )
    return buffer.getvalue()


def make_image(image_format: str = "PNG", size: tuple[int, int] = (400, 300)) -> bytes:
    """Build a small solid colour image."""

    image = Image.new("RGB", size, (90, 60, 220))
    buffer = io.BytesIO()
    image.save(buffer, format=image_format)
    return buffer.getvalue()


def page_count(data: bytes) -> int:
    """Count the pages of a PDF."""

    document = pymupdf.open(stream=data, filetype="pdf")
    count = document.page_count
    document.close()
    return count


def files_payload(*blobs: bytes) -> list[tuple[str, tuple[str, bytes]]]:
    """Build the ``files=`` payload used by the multi file endpoints."""

    return [("files", (f"file{index}.pdf", blob)) for index, blob in enumerate(blobs)]


def image_payload(*blobs: bytes) -> list[tuple[str, tuple[str, bytes]]]:
    """Build the ``files=`` payload used by the image endpoints."""

    return [("files", (f"image{index}.png", blob)) for index, blob in enumerate(blobs)]


def single_file_payload(blob: bytes) -> dict[str, tuple[str, bytes]]:
    """Build a ``files=`` payload holding exactly one document."""

    return {"files": ("file.pdf", blob)}
