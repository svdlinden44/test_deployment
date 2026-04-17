from __future__ import annotations

import abc
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from django.core.management.base import OutputWrapper


class BaseCatalogImporter(abc.ABC):
    """Contract for bringing third-party catalogs into local Recipe/Ingredient rows."""

    @property
    @abc.abstractmethod
    def source_key(self) -> str:
        """Must match `RecipeExternalRef.source_key` / `IngredientExternalRef.source_key`."""

    @abc.abstractmethod
    def run(
        self,
        stdout: OutputWrapper,
        stderr: OutputWrapper,
        style: Any,
        *,
        dry_run: bool,
        update: bool,
        skip_images: bool,
        with_ingredient_images: bool,
        delay_seconds: float,
        letters: str,
        max_recipes: int | None,
        api_key: str,
    ) -> None:
        """Execute import. Implementations must be idempotent per `source_key` + external id."""

