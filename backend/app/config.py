"""Environment driven configuration for the DOC Master backend.

Every setting can be provided through an environment variable or a ``.env``
file placed next to the ``backend`` folder. Values are read exactly once and
cached, so the rest of the application can rely on a single immutable object.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv

# ``backend/app/config.py`` -> ``backend`` -> repository root
BACKEND_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = BACKEND_DIR.parent

load_dotenv(BACKEND_DIR / ".env")
load_dotenv(REPO_ROOT / ".env")

DEFAULT_ALLOWED_ORIGINS = ("http://localhost:5173", "http://127.0.0.1:5173")


def _env_float(name: str, default: float) -> float:
    """Read a float from the environment, falling back to ``default``."""

    raw = os.getenv(name)
    if raw is None or raw.strip() == "":
        return default
    try:
        return float(raw)
    except ValueError:
        return default


def _env_int(name: str, default: int) -> int:
    """Read an integer from the environment, falling back to ``default``."""

    raw = os.getenv(name)
    if raw is None or raw.strip() == "":
        return default
    try:
        return int(raw)
    except ValueError:
        return default


def _env_bool(name: str, default: bool) -> bool:
    """Read a boolean flag such as ``true``/``1``/``yes``."""

    raw = os.getenv(name)
    if raw is None or raw.strip() == "":
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


def _env_list(name: str, default: tuple[str, ...]) -> tuple[str, ...]:
    """Read a comma separated list of strings."""

    raw = os.getenv(name)
    if raw is None or raw.strip() == "":
        return default
    items = tuple(item.strip() for item in raw.split(",") if item.strip())
    return items or default


@dataclass(frozen=True, slots=True)
class Settings:
    """Immutable runtime settings."""

    app_name: str
    version: str
    max_file_mb: float
    max_total_mb: float
    max_files: int
    max_pages_per_pdf: int
    rate_limit: str
    rate_limit_disabled: bool
    allowed_origins: tuple[str, ...]
    site_url: str
    analytics_id: str
    port: int
    frontend_dist: Path
    token_origin: str

    @property
    def max_file_bytes(self) -> int:
        """Maximum accepted size for a single uploaded file."""

        return int(self.max_file_mb * 1024 * 1024)

    @property
    def max_total_bytes(self) -> int:
        """Maximum accepted size for a whole request body."""

        return int(self.max_total_mb * 1024 * 1024)

    @property
    def compress_target_presets(self) -> tuple[int, ...]:
        """``Compress under X`` presets offered by the API and the UI."""

        return (100, 200, 500, 1024)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Build and cache the application settings."""

    return Settings(
        app_name=os.getenv("APP_NAME", "DOC Master"),
        version="1.0.0",
        max_file_mb=_env_float("MAX_FILE_MB", 25.0),
        max_total_mb=_env_float("MAX_TOTAL_MB", 120.0),
        max_files=_env_int("MAX_FILES", 20),
        max_pages_per_pdf=_env_int("MAX_PAGES_PER_PDF", 1000),
        rate_limit=os.getenv("RATE_LIMIT", "20/minute"),
        rate_limit_disabled=_env_bool("RATE_LIMIT_DISABLED", False),
        allowed_origins=_env_list("ALLOWED_ORIGINS", DEFAULT_ALLOWED_ORIGINS),
        site_url=os.getenv("SITE_URL", "https://docmaster.example").rstrip("/"),
        analytics_id=os.getenv("ANALYTICS_ID", "").strip(),
        port=_env_int("PORT", 8000),
        frontend_dist=Path(os.getenv("FRONTEND_DIST", str(REPO_ROOT / "frontend" / "dist"))),
        # Placeholder origin written into pre-rendered HTML. The backend swaps it
        # for ``SITE_URL`` while serving, so canonical URLs stay correct in every
        # environment without rebuilding the frontend.
        token_origin="https://docmaster.example",
    )
