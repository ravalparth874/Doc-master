"""Tests for the split endpoint."""

from __future__ import annotations

import zipfile
from io import BytesIO

from fastapi.testclient import TestClient
from pypdf import PdfReader

from conftest import single_file_payload


def _page_count(data: bytes) -> int:
    return len(PdfReader(BytesIO(data)).pages)


def test_split_by_range(client: TestClient, pdf_bytes_3: bytes) -> None:
    """A page range produces a PDF with only those pages."""

    response = client.post(
        "/api/split",
        files=single_file_payload(pdf_bytes_3),
        data={"mode": "range", "start": "2", "end": "3"},
    )

    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert _page_count(response.content) == 2


def test_split_rejects_out_of_range(client: TestClient, pdf_bytes_3: bytes) -> None:
    """Pages beyond the document length are refused with a clear message."""

    response = client.post(
        "/api/split",
        files=single_file_payload(pdf_bytes_3),
        data={"mode": "range", "start": "1", "end": "9"},
    )

    assert response.status_code == 400
    detail = response.json()["detail"]
    assert "3 page(s)" in detail


def test_split_rejects_non_numeric_range(client: TestClient, pdf_bytes_3: bytes) -> None:
    """Text in the page fields is reported in plain language."""

    response = client.post(
        "/api/split",
        files=single_file_payload(pdf_bytes_3),
        data={"mode": "range", "start": "one", "end": "two"},
    )

    assert response.status_code == 400
    assert "whole numbers" in response.json()["detail"]


def test_split_every_page_returns_zip(client: TestClient, pdf_bytes_3: bytes) -> None:
    """Mode ``all`` returns one single page PDF per page inside a ZIP."""

    response = client.post(
        "/api/split", files=single_file_payload(pdf_bytes_3), data={"mode": "all"}
    )

    assert response.status_code == 200
    assert response.headers["content-type"] == "application/zip"

    with zipfile.ZipFile(BytesIO(response.content)) as archive:
        names = sorted(archive.namelist())
        assert names == ["page-001.pdf", "page-002.pdf", "page-003.pdf"]
        first = archive.read("page-001.pdf")
        assert _page_count(first) == 1
