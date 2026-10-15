#!/usr/bin/env python3
"""Generate every DOC Master icon from the brand mark.

The icons mirror ``frontend/public/favicon.svg``: a rounded indigo-to-violet tile
with a white document and an indigo checkmark. Everything is drawn with Pillow so
the script runs anywhere, without a browser or an SVG rasteriser.

Usage::

    python scripts/generate_icons.py
    python scripts/generate_icons.py --output frontend/public --size 1024
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT = REPO_ROOT / "frontend" / "public"

BRAND_START = (79, 70, 229)  # indigo 600
BRAND_END = (124, 58, 237)  # violet 600
DOCUMENT = (255, 255, 255)
FOLD = (199, 210, 254)
CHECK = BRAND_START
BACKGROUND = (255, 255, 255)

ICON_SIZES = {
    "favicon-16x16.png": 16,
    "favicon-32x32.png": 32,
    "apple-touch-icon.png": 180,
    "android-chrome-192x192.png": 192,
    "android-chrome-512x512.png": 512,
}

FONT_CANDIDATES = (
    "C:/Windows/Fonts/segoeuib.ttf",
    "C:/Windows/Fonts/arialbd.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/System/Library/Fonts/Helvetica.ttc",
)


def diagonal_gradient(size: int) -> Image.Image:
    """Create the indigo to violet background used by every icon."""

    gradient = Image.new("RGB", (size, size), BRAND_START)
    pixels = gradient.load()
    for y in range(size):
        for x in range(size):
            ratio = (x + y) / (2 * (size - 1)) if size > 1 else 0.0
            pixels[x, y] = tuple(
                round(start + (end - start) * ratio)
                for start, end in zip(BRAND_START, BRAND_END)
            )
    return gradient


def rounded_mask(size: int, radius_ratio: float = 0.25) -> Image.Image:
    """Return an anti-aliased rounded square mask."""

    scale = 4
    mask = Image.new("L", (size * scale, size * scale), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        [0, 0, size * scale - 1, size * scale - 1],
        radius=int(size * scale * radius_ratio),
        fill=255,
    )
    return mask.resize((size, size), Image.LANCZOS)


def draw_mark(image: Image.Image) -> Image.Image:
    """Draw the document and checkmark used in the logo."""

    size = image.size[0]
    draw = ImageDraw.Draw(image)
    unit = size / 48

    left, top, right, bottom = 14 * unit, 11 * unit, 34 * unit, 37 * unit
    radius = 3 * unit

    draw.rounded_rectangle(
        [left, top, right, bottom], radius=radius, fill=DOCUMENT
    )

    # The folded corner in the top right of the page.
    fold_size = 7.4 * unit
    draw.polygon(
        [
            (26.5 * unit, top),
            (26.5 * unit, top + fold_size),
            (26.5 * unit + fold_size, top),
        ],
        fill=FOLD,
    )

    # Checkmark.
    stroke = max(int(round(unit * 3)), 2)
    draw.line(
        [
            (18.6 * unit, 26.4 * unit),
            (22.1 * unit, 30.0 * unit),
            (28.7 * unit, 22.8 * unit),
        ],
        fill=CHECK,
        width=stroke,
        joint="curve",
    )
    return image


def build_icon(size: int, *, transparent: bool = False) -> Image.Image:
    """Render the app icon at ``size`` pixels square."""

    gradient = diagonal_gradient(size)
    mask = rounded_mask(size)

    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0) if transparent else BACKGROUND + (255,))
    canvas.paste(gradient, (0, 0), mask)
    draw_mark(canvas)
    return canvas


def load_font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    """Load the first available bold font, falling back to the default one."""

    for candidate in FONT_CANDIDATES:
        path = Path(candidate)
        if path.exists():
            try:
                return ImageFont.truetype(str(path), size)
            except OSError:
                continue
    return ImageFont.load_default()


def text_width(draw: ImageDraw.ImageDraw, text: str, font: object) -> int:
    """Measure a string, tolerating fonts without a size attribute."""

    try:
        box = draw.textbbox((0, 0), text, font=font)  # type: ignore[arg-type]
    except (AttributeError, TypeError):
        return int(len(text) * getattr(font, "size", 12) * 0.6)
    return int(box[2] - box[0])


def text_height(draw: ImageDraw.ImageDraw, text: str, font: object) -> int:
    """Measure the height of a line of text."""

    try:
        box = draw.textbbox((0, 0), text, font=font)  # type: ignore[arg-type]
    except (AttributeError, TypeError):
        return int(getattr(font, "size", 12))
    return int(box[3] - box[1])


def build_og_image(width: int = 1200, height: int = 630) -> Image.Image:
    """Create the 1200x630 social sharing image."""

    background = Image.blend(
        Image.new("RGB", (width, height), (248, 250, 252)),
        diagonal_gradient(width).resize((width, height)),
        0.14,
    )
    draw = ImageDraw.Draw(background)

    icon = build_icon(200, transparent=True)
    background.paste(icon, (96, 108), icon)

    draw.text((340, 126), "DOC Master", font=load_font(76), fill=(15, 23, 42))
    draw.text(
        (340, 220),
        "All your PDF tools in one place",
        font=load_font(34),
        fill=(71, 85, 105),
    )

    chips = ["Merge PDF", "Split PDF", "Compress PDF", "JPG to PDF", "Rotate PDF", "Protect PDF"]
    chip_font = load_font(26)
    columns = 3
    gutter = 20
    left_margin = 96
    column_width = (width - left_margin * 2 - gutter * (columns - 1)) // columns

    for index, chip in enumerate(chips):
        row, column = divmod(index, columns)
        x = left_margin + column * (column_width + gutter)
        y = 380 + row * 64
        draw.rounded_rectangle(
            [x, y, x + column_width, y + 50], radius=25, fill=(238, 242, 255)
        )
        label_width = text_width(draw, chip, chip_font)
        label_height = text_height(draw, chip, chip_font)
        draw.text(
            (x + (column_width - label_width) / 2, y + (50 - label_height) / 2 - 4),
            chip,
            font=chip_font,
            fill=(67, 56, 202),
        )

    draw.text(
        (96, height - 78),
        "Free, fast and private. Your files are never stored.",
        font=load_font(30),
        fill=(100, 116, 139),
    )
    return background


def main() -> int:
    """Generate every icon plus the ICO and Open Graph image."""

    parser = argparse.ArgumentParser(description="Generate DOC Master favicons.")
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT,
        help="Directory that receives the generated files.",
    )
    parser.add_argument(
        "--og-width",
        type=int,
        default=1200,
        help="Width of the Open Graph image.",
    )
    args = parser.parse_args()

    output: Path = args.output
    output.mkdir(parents=True, exist_ok=True)

    master = build_icon(512)
    master_rgb = master.convert("RGB")

    for name, size in ICON_SIZES.items():
        resized = (
            master.resize((size, size), Image.LANCZOS)
            if size != 512
            else master
        )
        resized.save(output / name, format="PNG", optimize=True)
        print(f"Wrote {name} ({size}x{size})")

    master_rgb.save(
        output / "favicon.ico",
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48)],
    )
    print("Wrote favicon.ico (16x16, 32x32, 48x48)")

    og = build_og_image(args.og_width, int(args.og_width * 630 / 1200))
    og.save(output / "og-image.png", format="PNG", optimize=True)
    print(f"Wrote og-image.png ({og.size[0]}x{og.size[1]})")

    return 0


if __name__ == "__main__":
    sys.exit(main())