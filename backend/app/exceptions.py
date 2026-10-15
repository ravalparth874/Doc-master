"""User facing error types.

Every failure that a visitor can trigger is expressed as an :class:`AppError`.
The API layer turns it into a small JSON body such as
``{"detail": "This PDF is password protected"}`` and never leaks a stack trace.
"""

from __future__ import annotations


class AppError(Exception):
    """An expected, recoverable failure with a message safe to show a user."""

    def __init__(self, detail: str, status_code: int = 400) -> None:
        super().__init__(detail)
        self.detail = detail
        self.status_code = status_code


def too_large(detail: str) -> AppError:
    """Shortcut for ``413 Payload Too Large`` errors."""

    return AppError(detail, status_code=413)
