"""Background image processing for recipes (transparent PNG pipeline, etc.)."""

import io
import logging

from PIL import Image

logger = logging.getLogger(__name__)


def preview_recipe_image(raw: bytes) -> tuple[bytes, str]:
    """
    Build a PNG preview for side-by-side comparison before save.

    When `rembg` is installed, returns a cutout with alpha (label ``rembg``).
    Otherwise normalizes to PNG RGBA without removing the background (``passthrough``).
    """
    try:
        from rembg import remove

        out = remove(raw)
        if out:
            return out, "rembg"
    except Exception:
        pass

    im = Image.open(io.BytesIO(raw)).convert("RGBA")
    buf = io.BytesIO()
    im.save(buf, format="PNG")
    return buf.getvalue(), "passthrough"


def apply_recipe_image_cutout(recipe) -> str | None:
    """
    Replace ``recipe.image`` with a PNG cutout (rembg when available).

    Returns pipeline label ``rembg``, ``passthrough``, or ``None`` if skipped/failed.
    """
    from django.core.files.base import ContentFile
    from django.utils.text import slugify

    if not recipe.image:
        return None

    try:
        recipe.image.open("rb")
        try:
            raw = recipe.image.read()
        finally:
            recipe.image.close()
    except Exception as exc:
        logger.warning("Could not read recipe image pk=%s: %s", recipe.pk, exc)
        return None

    try:
        out_bytes, pipeline = preview_recipe_image(raw)
    except Exception as exc:
        logger.warning("preview_recipe_image failed pk=%s: %s", recipe.pk, exc)
        return None

    stem = slugify(recipe.slug)[:120] or f"recipe-{recipe.pk}"
    fname = f"{stem}-{recipe.pk}.png"
    try:
        recipe.image.save(fname, ContentFile(out_bytes), save=True)
    except Exception as exc:
        logger.warning("Could not save cutout pk=%s: %s", recipe.pk, exc)
        return None

    return pipeline


def schedule_recipe_image_processing(recipe_id: int) -> None:
    """Process stored media after upload (sync caller expected)."""
    from .models import Recipe

    recipe = Recipe.objects.filter(pk=recipe_id).first()
    if recipe:
        apply_recipe_image_cutout(recipe)

