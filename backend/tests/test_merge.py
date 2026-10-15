"""Tests for the merge endpoint."""

from __future__ import annotations

from io import BytesIO

from fastapi.testclient import TestClient
from pypdf import PdfReader, PdfWriter

from conftest import files_payload, make_text_pdf


def test_health_reports_ok(client: TestClient) -> None:
    """The deployment health check answers with status ok."""

    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_merge_preserves_order_and_page_count(client: TestClient, pdf_bytes_3: bytes) -> None:
    """Two PDFs are joined and every page is kept."""

    single = make_text_pdf(1, "first")
    response = client.post("/api/merge", files=files_payload(single, pdf_bytes_3))

    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert "merged.pdf" in response.headers["content-disposition"]

    reader = PdfReader(BytesIO(response.content))
    assert len(reader.pages) == 4
    assert "first - page 1" in reader.pages[0].extract_text()
    assert "page 3" in reader.pages[3].extract_text()


def test_merge_requires_two_files(client: TestClient, pdf_bytes: bytes) -> None:
    """Merging a single file is rejected with a friendly message."""

    response = client.post("/api/merge", files=files_payload(pdf_bytes))

    assert response.status_code == 400
    assert "at least two" in response.json()["detail"]


def test_merge_rejects_non_pdf(client: TestClient) -> None:
    """A text file renamed to .pdf is refused."""

    payload = files_payload(b"this is plain text", make_text_pdf(1))
    response = client.post("/api/merge", files=payload)

    assert response.status_code == 400
    assert "not a valid PDF" in response.json()["detail"]


def test_merge_rejects_empty_file(client: TestClient, pdf_bytes: bytes) -> None:
    """A zero byte upload is refused."""

    payload = files_payload(b"", pdf_bytes)
    response = client.post("/api/merge", files=payload)

    assert response.status_code == 400
    assert "empty" in response.json()["detail"]


def test_merge_reports_password_protected(client: TestClient) -> None:
    """Encrypted documents produce a clear message instead of a crash."""

    writer = PdfWriter()
    writer.add_blank_page(width=200, height=200)
    writer.encrypt("secret123")
    buffer = BytesIO()
    writer.write(buffer)

    response = client.post("/api/merge", files=files_payload(buffer.getvalue(), make_text_pdf(1)))

    assert response.status_code == 400
    assert response.json()["detail"] == "This PDF is password protected"


def test_merge_enforces_file_size_limit(client: TestClient, pdf_bytes: bytes) -> None:
    """Files above MAX_FILE_MB are refused with HTTP 413."""

    payload = files_payload(b"x" * (1_200_000), pdf_bytes)
    response = client.post("/api/merge", files=payload)

    assert response.status_code == 413
    assert "too big" in response.json()["detail"]


def test_merge_enforces_file_count_limit(client: TestClient) -> None:
    """More files than MAX_FILES are refused."""

    blobs = [make_text_pdf(1, f"doc{index}") for index in range(11)]
    response = client.post("/api/merge", files=files_payload(*blobs))

    assert response.status_code == 400
    assert "up to 10 files" in response.json()["detail"]
