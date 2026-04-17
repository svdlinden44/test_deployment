from __future__ import annotations

from argparse import ArgumentParser
from typing import Any, ClassVar

from django.core.management.base import BaseCommand

from cocktails import source_keys
from cocktails.importers.base import BaseCatalogImporter
from cocktails.importers.the_cocktail_db import DEFAULT_LETTERS, TheCocktailDbImporter


class Command(BaseCommand):
    help = (
        "Import cocktail catalog data into local Recipe / Ingredient rows. "
        "Register additional importers in SOURCE_IMPORTERS."
    )

    SOURCE_IMPORTERS: ClassVar[dict[str, type[BaseCatalogImporter]]] = {
        source_keys.THECOCKTAILDB: TheCocktailDbImporter,
    }

    def add_arguments(self, parser: ArgumentParser) -> None:
        parser.add_argument(
            "source",
            nargs="?",
            default=source_keys.THECOCKTAILDB,
            help=f"Importer key (default: {source_keys.THECOCKTAILDB}).",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Fetch ids and report how many would import (no DB writes).",
        )
        parser.add_argument(
            "--update",
            action="store_true",
            help="Refresh recipes that already have an external ref for this source.",
        )
        parser.add_argument(
            "--skip-images",
            action="store_true",
            help="Do not download recipe hero images.",
        )
        parser.add_argument(
            "--with-ingredient-images",
            action="store_true",
            help="Also download ingredient thumbnails from TheCocktailDB static URLs.",
        )
        parser.add_argument(
            "--delay",
            type=float,
            default=0.12,
            metavar="SEC",
            help="Pause between drinks after HTTP calls (default 0.12).",
        )
        parser.add_argument(
            "--letters",
            default=DEFAULT_LETTERS,
            help=f"Letters/digits used for browse-by-letter discovery (default: {DEFAULT_LETTERS!r}).",
        )
        parser.add_argument(
            "--max-recipes",
            type=int,
            default=None,
            metavar="N",
            help="Import at most N drinks after discovery (testing).",
        )
        parser.add_argument(
            "--api-key",
            default="",
            help="TheCocktailDB API key segment (default: env THECOCKTAILDB_API_KEY or 1).",
        )

    def handle(self, *args: Any, **options: Any) -> None:
        key = options["source"]
        cls = self.SOURCE_IMPORTERS.get(key)
        if not cls:
            choices = ", ".join(sorted(self.SOURCE_IMPORTERS))
            self.stderr.write(self.style.ERROR(f"Unknown source {key!r}. Choose one of: {choices}"))
            return

        importer = cls()
        importer.run(
            self.stdout,
            self.stderr,
            self.style,
            dry_run=options["dry_run"],
            update=options["update"],
            skip_images=options["skip_images"],
            with_ingredient_images=options["with_ingredient_images"],
            delay_seconds=options["delay"],
            letters=options["letters"],
            max_recipes=options["max_recipes"],
            api_key=options["api_key"],
        )
