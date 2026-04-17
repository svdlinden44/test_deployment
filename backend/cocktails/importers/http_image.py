from __future__ import annotations

from urllib.parse import urlparse

import requests
from django.core.files.base import ContentFile


def download_into_image_field(instance, field_name: str, url: str | None, *, timeout: float = 45) -> bool:
    """Fetch `url` and assign to `instance.<field_name>` ImageField. Returns True if saved."""
    if not url:
        return False
    try:
        r = requests.get(url.strip(), timeout=timeout)
        r.raise_for_status()
    except (requests.RequestException, OSError):
        return False

    path = urlparse(url).path
    fname = path.rsplit("/", 1)[-1].strip() or "image.jpg"
    if "." not in fname:
        fname = f"{fname}.jpg"

    field = getattr(instance, field_name)
    field.save(fname, ContentFile(r.content), save=False)
    return True
