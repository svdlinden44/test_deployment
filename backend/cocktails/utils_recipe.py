"""Helpers for member-owned recipes and visibility."""

import secrets

from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils.text import slugify

from .models import Recipe


def generate_member_recipe_slug(title: str, user_id: int) -> str:
    """Globally unique slug for user-created recipes."""
    base = slugify(title.strip())[:160] or "recipe"
    for _ in range(16):
        suf = secrets.token_hex(3)
        slug = f"m-{user_id}-{base}-{suf}"
        slug = slug[:250]
        if not Recipe.objects.filter(slug=slug).exists():
            return slug
    raise RuntimeError("Could not allocate unique slug")


def accessible_recipes_queryset(request):
    """Recipes visible on detail: published catalog + current user's member recipes."""
    qs = Recipe.objects.select_related("category").prefetch_related("recipe_ingredients__ingredient")
    q = Q(source=Recipe.Source.CATALOG, is_published=True)
    user = request.user
    if getattr(user, "is_authenticated", False):
        q |= Q(source=Recipe.Source.MEMBER, created_by=user)
    return qs.filter(q)


def get_recipe_for_member_actions(request, slug: str) -> Recipe:
    """Recipe the user may favorite, wishlist, or rate (same visibility as detail)."""
    return get_object_or_404(accessible_recipes_queryset(request), slug=slug)
