"""Tests for images, rotation and password protection."""

from __future__ import annotations

import zipfile
from io import BytesIO

from fastapi.testclient import TestClient
from pypdf import PdfReader

from conftest import (
    files_payload,
    image_payload,
    make_image,
    make_text_pdf,
    single_file_payload,
)


def _page_count(data: bytes) -> int:
    return len(PdfReader(BytesIO(data)).pages)


def test_images_to_pdf_creates_a4_pages(client: TestClient) -> None:
    """Two images become one two page PDF with A4 sized pages."""

    response = client.post(
        "/api/images-to-pdf",
        files=image_payload(make_image("PNG"), make_image("JPEG")),
        data={"page_size": "a4"},
    )

    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert _page_count(response.content) == 2

    import pymupdf

    document = pymupdf.open(stream=response.content, filetype="pdf")
    width, height = document[0].rect.width, document[0].rect.height
    document.close()
    assert 594 <= round(width) <= 596
    assert 841 <= round(height) <= 843


def test_images_to_pdf_original_page_size(client: TestClient) -> None:
    """The original option keeps the image aspect ratio on its own page."""

    response = client.post(
        "/api/images-to-pdf",
        files=image_payload(make_image("PNG", (800, 600))),
        data={"page_size": "original"},
    )

    assert response.status_code == 200

    import pymupdf

    document = pymupdf.open(stream=response.content, filetype="pdf")
    rect = document[0].rect
    document.close()
    assert rect.width > rect.height


def test_images_to_pdf_rejects_non_images(client: TestClient) -> None:
    """A PDF uploaded as an image is refused."""

    response = client.post("/api/images-to-pdf", files=image_payload(make_text_pdf(1)))

    assert response.status_code == 400
    assert "JPG and PNG" in response.json()["detail"]


def test_pdf_to_images_returns_zip(client: TestClient, pdf_bytes_3: bytes) -> None:
    """Every page is exported as an image inside a ZIP archive."""

    response = client.post(
        "/api/pdf-to-images",
        files=single_file_payload(pdf_bytes_3),
        data={"format": "png"},
    )

    assert response.status_code == 200
    with zipfile.ZipFile(BytesIO(response.content)) as archive:
        assert sorted(archive.namelist()) == [
            "page-001.png",
            "page-002.png",
            "page-003.png",
        ]
        assert archive.read("page-001.png").startswith(b"\x89PNG")


def test_pdf_to_images_rejects_bad_format(client: TestClient, pdf_bytes: bytes) -> None:
    """Only PNG and JPG are accepted."""

    response = client.post(
        "/api/pdf-to-images",
        files=single_file_payload(pdf_bytes),
        data={"format": "tiff"},
    )

    assert response.status_code == 400
    assert "JPG or PNG" in response.json()["detail"]


def test_rotate_all_pages(client: TestClient, pdf_bytes_3: bytes) -> None:
    """Rotating every page by 90 degrees is reflected in the page rotation."""

    response = client.post(
        "/api/rotate",
        files=single_file_payload(pdf_bytes_3),
        data={"degrees": "90", "pages": "all"},
    )

    assert response.status_code == 200
    reader = PdfReader(BytesIO(response.content))
    assert len(reader.pages) == 3
    assert reader.pages[0].get("/Rotate", 0) == 90


def test_rotate_single_page(client: TestClient, pdf_bytes_3: bytes) -> None:
    """Only the selected page is rotated."""

    response = client.post(
        "/api/rotate",
        files=single_file_payload(pdf_bytes_3),
        data={"degrees": "180", "pages": "2"},
    )

    assert response.status_code == 200
    reader = PdfReader(BytesIO(response.content))
    assert reader.pages[0].get("/Rotate", 0) == 0
    assert reader.pages[1].get("/Rotate", 0) == 180


def test_rotate_rejects_unknown_angle(client: TestClient, pdf_bytes: bytes) -> None:
    """Only 90, 180 and 270 degree rotations are supported."""

    response = client.post(
        "/api/rotate",
        files=single_file_payload(pdf_bytes),
        data={"degrees": "45", "pages": "all"},
    )

    assert response.status_code == 400
    assert "90, 180 or 270" in response.json()["detail"]


def test_protect_then_unlock_round_trip(client: TestClient, pdf_bytes: bytes) -> None:
    """A password can be added and then removed again."""

    protected = client.post(
        "/api/protect",
        files=single_file_payload(pdf_bytes),
        data={"password": "mypass12", "confirm_password": "mypass12"},
    )
    assert protected.status_code == 200
    assert PdfReader(BytesIO(protected.content)).is_encrypted

    unlocked = client.post(
        "/api/unlock", files=single_file_payload(protected.content), data={"password": "mypass12"}
    )
    assert unlocked.status_code == 200

    reader = PdfReader(BytesIO(unlocked.content))
    assert not reader.is_encrypted
    assert len(reader.pages) == 1


def test_unlock_rejects_wrong_password(client: TestClient, pdf_bytes: bytes) -> None:
    """A wrong password produces a friendly message."""

    protected = client.post(
        "/api/protect",
        files=single_file_payload(pdf_bytes),
        data={"password": "mypass12", "confirm_password": "mypass12"},
    )
    response = client.post(
        "/api/unlock", files=single_file_payload(protected.content), data={"password": "wrongpass"}
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "The password you entered is incorrect."


def test_protect_requires_matching_confirmation(client: TestClient, pdf_bytes: bytes) -> None:
    """Mismatched passwords are refused."""

    response = client.post(
        "/api/protect",
        files=single_file_payload(pdf_bytes),
        data={"password": "mypass12", "confirm_password": "other12"},
    )

    assert response.status_code == 400
    assert "do not match" in response.json()["detail"]


def test_merge_still_works_with_several_documents(client: TestClient) -> None:
    """Regression check for the merge endpoint used by the home page demo."""

    blobs = [make_text_pdf(1, f"doc{index}") for index in range(3)]
    response = client.post("/api/merge", files=files_payload(*blobs))

    assert response.status_code == 200
    assert _page_count(response.content) == 3


def test_contact_endpoint_accepts_a_message(client: TestClient) -> None:
    """The contact form is accepted and acknowledged."""

    response = client.post(
        "/api/contact",
        json={
            "name": "Ravi Kumar",
            "email": "ravi@example.com",
            "message": "The compress tool works perfectly, thank you!",
            "company": "",
        },
    )

    assert response.status_code == 200
    assert response.json()["ok"] is True


def test_contact_rejects_short_message(client: TestClient) -> None:
    """Validation returns a friendly error, not a traceback."""

    response = client.post(
        "/api/contact",
        json={"name": "Ravi", "email": "ravi@example.com", "message": "hi"},
    )

    assert response.status_code == 400
    assert "not valid" in response.json()["detail"]
