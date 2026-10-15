"""PDF and image processing.

Every function in this module works on ``bytes`` objects held in memory and
returns ``bytes``. No temporary files are created, nothing is written to disk
and file names are never used for logging.
"""

from __future__ import annotations

import io
import zipfile
from collections.abc import Iterable, Sequence

import img2pdf
import pymupdf
from PIL import Image, ImageOps
from pypdf import PdfReader, PdfWriter
from pypdf.errors import (
    DependencyError,
    EmptyFileError,
    FileNotDecryptedError,
    PdfReadError,
    PyPdfError,
    WrongPasswordError,
)

from ..exceptions import AppError
from .validation import parse_page_selection

# Pages rendered at 96 DPI by img2pdf. A canvas of 794 x 1123 pixels therefore
# becomes an A4 page of 595.5 x 842.25 points.
PAGE_CANVASES: dict[str, tuple[int, int]] = {
    "a4": (794, 1123),
    "letter": (816, 1056),
}

COMPRESSION_LEVELS = ("low", "medium", "high")

# (dpi, jpeg quality) ladder used by the "compress under X KB" presets.
_COMPRESSION_LADDER: tuple[tuple[int, int], ...] = (
    (150, 75),
    (130, 70),
    (112, 66),
    (96, 62),
    (85, 57),
    (75, 52),
    (66, 47),
    (58, 42),
    (50, 37),
    (42, 32),
)


class PdfProcessingError(AppError):
    """Raised when a document cannot be processed."""


def _corrupted(detail: str = "This PDF is corrupted or not a valid PDF file.") -> AppError:
    return PdfProcessingError(detail)


def open_pdf(data: bytes, *, password: str | None = None) -> PdfReader:
    """Open PDF bytes with pypdf, raising friendly errors.

    Encrypted documents are opened when the password is known or when only an
    owner password protects them; otherwise the caller gets a clear message.
    """

    try:
        reader = PdfReader(io.BytesIO(data))
    except EmptyFileError:
        raise PdfProcessingError("This PDF is empty, so there is nothing to do.") from None
    except (PdfReadError, PyPdfError, ValueError, KeyError, IndexError, TypeError, OSError) as exc:
        raise _corrupted() from exc

    if reader.is_encrypted:
        try:
            result = reader.decrypt(password or "")
        except (NotImplementedError, PyPdfError, ValueError) as exc:
            raise PdfProcessingError(
                "This PDF uses an encryption method DOC Master cannot open."
            ) from exc
        if not result:
            raise PdfProcessingError("This PDF is password protected")
    return reader


def _write_pdf(writer: PdfWriter) -> bytes:
    """Serialise a :class:`PdfWriter` into memory."""

    buffer = io.BytesIO()
    writer.write(buffer)
    return buffer.getvalue()


def _reader_pages(reader: PdfReader, detail: str) -> list:
    """Materialise the page list, converting library errors into friendly ones."""

    try:
        return list(reader.pages)
    except (FileNotDecryptedError, PyPdfError, ValueError, TypeError) as exc:
        raise _corrupted(detail) from exc


def merge_pdfs(blobs: Sequence[bytes]) -> bytes:
    """Concatenate several PDFs, preserving the order of ``blobs``."""

    if len(blobs) < 2:
        raise PdfProcessingError("Please add at least two PDF files to merge.")

    writer = PdfWriter()
    for blob in blobs:
        reader = open_pdf(blob)
        for page in _reader_pages(reader, "One of the PDFs could not be read."):
            try:
                writer.add_page(page)
            except (PyPdfError, ValueError, TypeError) as exc:
                raise PdfProcessingError(
                    "One of the PDFs could not be merged. It may be damaged."
                ) from exc

    if not writer.pages:
        raise PdfProcessingError("The selected PDFs have no pages.")
    return _write_pdf(writer)


def extract_pages(data: bytes, start: int, end: int) -> bytes:
    """Return a new PDF holding pages ``start`` to ``end`` (1-based, inclusive)."""

    reader = open_pdf(data)
    pages = _reader_pages(reader, "This PDF could not be read.")
    total = len(pages)
    if total == 0:
        raise PdfProcessingError("This PDF has no pages.")
    if start < 1 or end > total or start > end:
        raise PdfProcessingError(
            f"This PDF has {total} page(s). Choose a range between 1 and {total}."
        )

    writer = PdfWriter()
    for index in range(start - 1, end):
        writer.add_page(pages[index])
    return _write_pdf(writer)


def split_every_page(data: bytes) -> list[tuple[str, bytes]]:
    """Split a PDF into one single-page PDF per page."""

    reader = open_pdf(data)
    pages = _reader_pages(reader, "This PDF could not be read.")
    if not pages:
        raise PdfProcessingError("This PDF has no pages.")

    entries: list[tuple[str, bytes]] = []
    for index, page in enumerate(pages, start=1):
        writer = PdfWriter()
        writer.add_page(page)
        entries.append((f"page-{index:03d}.pdf", _write_pdf(writer)))
    return entries


def zip_entries(entries: Iterable[tuple[str, bytes]]) -> bytes:
    """Pack ``(name, data)`` pairs into a ZIP archive held in memory."""

    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for name, data in entries:
            archive.writestr(name, data)
    return buffer.getvalue()


def _open_document(data: bytes) -> pymupdf.Document:
    """Open PDF bytes with PyMuPDF and make sure they contain pages."""

    try:
        document = pymupdf.open(stream=data, filetype="pdf")
    except (pymupdf.FileDataError, RuntimeError, ValueError) as exc:
        raise _corrupted() from exc
    if document.page_count == 0:
        document.close()
        raise PdfProcessingError("This PDF has no pages.")
    return document


def _rewrite_embedded_images(document: pymupdf.Document, level: str) -> None:
    """Re-encode embedded images at a lower quality."""

    quality = 55 if level == "medium" else 35
    try:
        document.rewrite_images(dpi_target=150, quality=quality)
    except Exception:  # noqa: BLE001 - never fail a job over one odd image
        return


def _optimize(data: bytes, level: str) -> bytes:
    """Rewrite the PDF with cleaned structure and deflated streams."""

    document = _open_document(data)
    try:
        if level in {"medium", "high"}:
            _rewrite_embedded_images(document, level)
        try:
            document.subset_fonts()
        except Exception:  # noqa: BLE001 - font subsetting is best effort
            pass
        result = document.tobytes(garbage=4, deflate=True, deflate_images=True, clean=True)
    finally:
        document.close()

    if level == "high" and len(result) > int(len(data) * 0.75):
        rasterized = _rasterize(data, dpi=110, quality=60)
        if len(rasterized) < len(result):
            return rasterized

    return result if len(result) < len(data) else data


def _rasterize(data: bytes, *, dpi: int, quality: int) -> bytes:
    """Flatten every page into a JPEG image, which shrinks files dramatically."""

    source = _open_document(data)
    target = pymupdf.open()
    try:
        matrix = pymupdf.Matrix(dpi / 72, dpi / 72)
        for page in source:
            pixmap = page.get_pixmap(matrix=matrix, alpha=False)
            image = Image.frombytes("RGB", (pixmap.width, pixmap.height), pixmap.samples)
            buffer = io.BytesIO()
            image.save(buffer, format="JPEG", quality=quality, optimize=True)
            new_page = target.new_page(width=pixmap.width, height=pixmap.height)
            new_page.insert_image(
                pymupdf.Rect(0, 0, pixmap.width, pixmap.height),
                stream=buffer.getvalue(),
            )
        return target.tobytes(garbage=4, deflate=True)
    except (pymupdf.FileDataError, RuntimeError, ValueError) as exc:
        raise _corrupted("This PDF could not be compressed.") from exc
    finally:
        target.close()
        source.close()


def compress_pdf(data: bytes, level: str, target_kb: int | None = None) -> bytes:
    """Compress a PDF.

    ``level`` is ``low``, ``medium`` or ``high``. When ``target_kb`` is given the
    function keeps shrinking the file until it fits below that size, and raises a
    friendly error when even the smallest render is still too large.
    """

    if level not in COMPRESSION_LEVELS:
        raise PdfProcessingError("Choose Low, Medium or High compression.")
    if target_kb is not None and target_kb <= 0:
        raise PdfProcessingError("The target size must be greater than 0.")

    optimized = _optimize(data, level)

    if target_kb is None:
        return optimized

    limit = target_kb * 1024
    if len(optimized) <= limit:
        return optimized

    for dpi, quality in _COMPRESSION_LADDER:
        candidate = _rasterize(data, dpi=dpi, quality=quality)
        if len(candidate) <= limit:
            return candidate

    raise PdfProcessingError(
        f"We could not get this file under {target_kb} KB. "
        "Try a larger target size or remove some pages."
    )


def _flatten_to_rgb(data: bytes) -> Image.Image:
    """Decode image bytes, honour EXIF rotation and remove transparency."""

    try:
        image = Image.open(io.BytesIO(data))
        image.load()
    except Exception as exc:  # noqa: BLE001 - Pillow raises many error types
        raise PdfProcessingError(
            "One of the images could not be read. Please try a different file."
        ) from exc

    try:
        image = ImageOps.exif_transpose(image) or image
    except Exception:  # noqa: BLE001 - broken EXIF must not break the job
        pass

    if image.mode in {"RGBA", "LA", "PA"} or (image.mode == "P" and "transparency" in image.info):
        rgba = image.convert("RGBA")
        flattened = Image.new("RGB", rgba.size, (255, 255, 255))
        flattened.paste(rgba, mask=rgba.split()[-1])
        return flattened
    return image.convert("RGB")


def _image_to_page_jpeg(data: bytes, page_size: str) -> bytes:
    """Render one image onto a white page canvas encoded as JPEG."""

    image = _flatten_to_rgb(data)

    if page_size in PAGE_CANVASES:
        canvas_width, canvas_height = PAGE_CANVASES[page_size]
        fitted = image.copy()
        fitted.thumbnail((canvas_width, canvas_height), Image.LANCZOS)
        canvas = Image.new("RGB", (canvas_width, canvas_height), "white")
        canvas.paste(
            fitted,
            ((canvas_width - fitted.width) // 2, (canvas_height - fitted.height) // 2),
        )
        page_image = canvas
    else:
        page_image = image

    buffer = io.BytesIO()
    page_image.save(buffer, format="JPEG", quality=92, optimize=True)
    return buffer.getvalue()


def images_to_pdf(images: Sequence[bytes], page_size: str = "a4") -> bytes:
    """Combine JPG/PNG images into a single PDF, in the given order."""

    if not images:
        raise PdfProcessingError("Please add at least one image.")

    if page_size not in {"a4", "letter", "original"}:
        page_size = "a4"

    pages = [_image_to_page_jpeg(data, page_size) for data in images]
    try:
        return img2pdf.convert(pages)
    except Exception as exc:  # noqa: BLE001 - img2pdf raises bare exceptions
        raise PdfProcessingError(
            "The images could not be converted. Please try different files."
        ) from exc


def pdf_to_images(
    data: bytes, image_format: str = "jpeg", quality: int = 85
) -> list[tuple[str, bytes]]:
    """Render every page into a PNG or JPEG image."""

    if image_format not in {"jpeg", "png"}:
        raise PdfProcessingError("Choose PNG or JPG as the output format.")
    quality = max(30, min(quality, 95))

    document = _open_document(data)
    entries: list[tuple[str, bytes]] = []
    try:
        for index, page in enumerate(document, start=1):
            try:
                pixmap = page.get_pixmap(alpha=False)
            except (RuntimeError, ValueError) as exc:
                raise _corrupted("A page of this PDF could not be rendered.") from exc
            if image_format == "png":
                entries.append((f"page-{index:03d}.png", pixmap.tobytes("png")))
            else:
                image = Image.frombytes("RGB", (pixmap.width, pixmap.height), pixmap.samples)
                buffer = io.BytesIO()
                image.save(buffer, format="JPEG", quality=quality, optimize=True)
                entries.append((f"page-{index:03d}.jpg", buffer.getvalue()))
    finally:
        document.close()
    return entries


def rotate_pdf(data: bytes, degrees: int, selection: str = "all") -> bytes:
    """Rotate the selected pages by ``degrees`` clockwise."""

    if degrees not in {90, 180, 270}:
        raise PdfProcessingError("Choose a rotation of 90, 180 or 270 degrees.")

    document = _open_document(data)
    try:
        total = document.page_count
        indexes = parse_page_selection(selection, total)
        for index in indexes:
            page = document[index]
            page.set_rotation((page.rotation + degrees) % 360)
        return document.tobytes(garbage=3, deflate=True)
    finally:
        document.close()


def protect_pdf(data: bytes, password: str) -> bytes:
    """Return a copy of the PDF encrypted with AES-256."""

    reader = open_pdf(data)
    if reader.is_encrypted:
        raise PdfProcessingError("This PDF is already password protected.")

    writer = PdfWriter()
    for page in _reader_pages(reader, "This PDF could not be read."):
        writer.add_page(page)
    try:
        writer.encrypt(user_password=password, algorithm="AES-256")
    except DependencyError:
        # ``cryptography`` is not installed: fall back to the built-in cipher.
        try:
            writer.encrypt(user_password=password, algorithm="RC4-128")
        except (PyPdfError, ValueError) as exc:
            raise PdfProcessingError("This PDF could not be protected.") from exc
    except (PyPdfError, ValueError) as exc:
        raise PdfProcessingError("This PDF could not be protected.") from exc
    return _write_pdf(writer)


def unlock_pdf(data: bytes, password: str) -> bytes:
    """Remove the password from a protected PDF."""

    try:
        reader = PdfReader(io.BytesIO(data))
    except EmptyFileError:
        raise PdfProcessingError("This PDF is empty, so there is nothing to do.") from None
    except (PdfReadError, PyPdfError, ValueError, KeyError, TypeError, OSError) as exc:
        raise _corrupted() from exc

    if not reader.is_encrypted:
        raise PdfProcessingError("This PDF is not password protected.")

    try:
        if not reader.decrypt(password):
            raise PdfProcessingError("The password you entered is incorrect.")
    except (WrongPasswordError, PyPdfError, ValueError, NotImplementedError) as exc:
        raise PdfProcessingError("The password you entered is incorrect.") from exc

    writer = PdfWriter()
    for page in _reader_pages(reader, "This PDF could not be read."):
        writer.add_page(page)
    return _write_pdf(writer)
