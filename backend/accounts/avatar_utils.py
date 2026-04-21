"""Download provider profile photos into User.avatar when empty."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING
from urllib.parse import urlparse

import requests
from django.core.files.base import ContentFile

if TYPE_CHECKING:
    from .models import User

logger = logging.getLogger(__name__)

MAX_BYTES = 5 * 1024 * 1024


def assign_avatar_from_url_if_empty(user: User, photo_url: str | None) -> None:
    """Fetch image from HTTPS URL and save to user.avatar only if user has no avatar yet."""
    if not photo_url or user.avatar:
        return
    parsed = urlparse(photo_url)
    if parsed.scheme not in ("https", "http"):
        return
    try:
        r = requests.get(photo_url, timeout=20, stream=True)
        if r.status_code != 200:
            return
        content = r.content
        if len(content) > MAX_BYTES:
            logger.warning("Avatar image too large, skipping")
            return
        ctype = (r.headers.get("Content-Type") or "").split(";")[0].strip().lower()
        ext = ".jpg"
        if "png" in ctype:
            ext = ".png"
        elif "webp" in ctype:
            ext = ".webp"
        elif "gif" in ctype:
            ext = ".gif"
        user.avatar.save(f"{user.pk}_oauth{ext}", ContentFile(content), save=True)
    except requests.RequestException as e:
        logger.warning("Avatar fetch failed: %s", e)
    except Exception as e:
        # PIL / storage / DB errors must not break OAuth login.
        logger.warning("Avatar import failed (non-fatal): %s", e)


def facebook_profile_picture_url(data: dict) -> str | None:
    pic = data.get("picture")
    if isinstance(pic, dict):
        inner = pic.get("data")
        if isinstance(inner, dict):
            url = inner.get("url")
            return url if isinstance(url, str) else None
    return None
