"""Contact form endpoint.

Messages are validated, rate limited and answered with a short confirmation.
DOC Master stores nothing, so the message is simply acknowledged in memory.
"""

from __future__ import annotations

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from ..rate_limit import CONTACT_LIMIT, limiter

router = APIRouter(prefix="/api", tags=["contact"])

EMAIL_MAX_LENGTH = 254
MESSAGE_MAX_LENGTH = 4000


class ContactMessage(BaseModel):
    """Payload posted by the contact form."""

    name: str = Field(min_length=1, max_length=80)
    email: str = Field(min_length=5, max_length=EMAIL_MAX_LENGTH)
    message: str = Field(min_length=10, max_length=MESSAGE_MAX_LENGTH)
    # Honeypot: real visitors leave this empty.
    company: str = Field(default="", max_length=200)


@router.post("/contact", summary="Send a message")
@limiter.limit(CONTACT_LIMIT)
async def contact(request: Request, payload: ContactMessage):
    """Accept a message and acknowledge it."""

    del request
    if payload.company:
        # Silently accept submissions from bots.
        return JSONResponse({"ok": True, "message": "Thanks for your message."})

    name = payload.name.strip()
    email = payload.email.strip()
    message = payload.message.strip()

    if len(name) < 2:
        return JSONResponse({"detail": "Please enter your name."}, status_code=400)
    if "@" not in email or "." not in email.rsplit("@", 1)[-1]:
        return JSONResponse({"detail": "Please enter a valid email address."}, status_code=400)
    if len(message) < 10:
        return JSONResponse({"detail": "Please write a slightly longer message."}, status_code=400)

    return JSONResponse({"ok": True, "message": "Thanks for your message. We will reply soon."})
