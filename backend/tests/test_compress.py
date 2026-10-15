"""Tests for the compress endpoint."""

from __future__ import annotations

from io import BytesIO

from fastapi.testclient import TestClient
from pypdf import PdfReader

from conftest import make_image_pdf, make_text_pdf, single_file_payload


def _page_count(data: bytes) -> int:
    return len(PdfReader(BytesIO(data)).pages)


def test_compress_medium_keeps_every_page(client: TestClient, pdf_bytes_3: bytes) -> None:
    """Compression keeps all pages and returns a readable PDF."""

    response = client.post(
        "/api/compress", files=single_file_payload(pdf_bytes_3), data={"level": "medium"}
    )

    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert _page_count(response.content) == 3


def test_compress_high_reduces_a_scanned_pdf(client: TestClient) -> None:
    """A photo heavy PDF becomes noticeably smaller at high compression."""

    original = make_image_pdf(pages=1)
    response = client.post(
        "/api/compress", files=single_file_payload(original), data={"level": "high"}
    )

    assert response.status_code == 200
    assert len(response.content) < len(original)
    assert _page_count(response.content) == 1


def test_compress_never_returns_a_larger_file(client: TestClient, pdf_bytes: bytes) -> None:
    """Already tiny files are returned unchanged rather than grown."""

    response = client.post(
        "/api/compress", files=single_file_payload(pdf_bytes), data={"level": "low"}
    )

    assert response.status_code == 200
    assert len(response.content) <= len(pdf_bytes)


def test_compress_under_target_size(client: TestClient) -> None:
    """The ``target_kb`` preset produces a file below the requested size."""

    original = make_image_pdf(pages=2)
    response = client.post(
        "/api/compress",
        files=single_file_payload(original),
        data={"level": "high", "target_kb": "100"},
    )

    assert response.status_code == 200
    assert len(response.content) <= 100 * 1024
    assert _page_count(response.content) == 2


def test_compress_skips_work_when_already_small(client: TestClient, pdf_bytes_3: bytes) -> None:
    """A file that already fits the target is returned as a valid PDF."""

    response = client.post(
        "/api/compress",
        files=single_file_payload(pdf_bytes_3),
        data={"level": "low", "target_kb": "500"},
    )

    assert response.status_code == 200
    assert _page_count(response.content) == 3


def test_compress_rejects_unknown_level(client: TestClient, pdf_bytes: bytes) -> None:
    """Unknown compression levels produce a friendly error."""

    response = client.post(
        "/api/compress", files=single_file_payload(pdf_bytes), data={"level": "extreme"}
    )

    assert response.status_code == 400
    assert "Low, Medium or High" in response.json()["detail"]


def test_compress_rejects_invalid_target(client: TestClient, pdf_bytes: bytes) -> None:
    """A non numeric target size is reported clearly."""

    response = client.post(
        "/api/compress",
        files=single_file_payload(pdf_bytes),
        data={"level": "low", "target_kb": "tiny"},
    )

    assert response.status_code == 400
    assert "target size" in response.json()["detail"]


def test_compress_handles_corrupt_pdf(client: TestClient) -> None:
    """A file that only claims to be a PDF fails with a readable message."""

    response = client.post(
        "/api/compress",
        files=single_file_payload(b"%PDF-1.7\nnot really a pdf"),
        data={"level": "low"},
    )

    assert response.status_code == 400
    assert "corrupted" in response.json()["detail"]


def test_compress_text_pdf_stays_readable(client: TestClient) -> None:
    """Text based documents keep selectable text at medium compression."""

    original = make_text_pdf(2)
    response = client.post(
        "/api/compress", files=single_file_payload(original), data={"level": "medium"}
    )

    assert response.status_code == 200
    reader = PdfReader(BytesIO(response.content))
    assert "DOC Master test" in (reader.pages[0].extract_text() or "")
