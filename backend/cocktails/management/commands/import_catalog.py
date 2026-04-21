from __future__ import annotations

import os
from argparse import ArgumentParser
from typing import Any, ClassVar

from django.core.management.base import BaseCommand

from cocktails import source_keys
from cocktails.importers.base import BaseCatalogImporter
from cocktails.importers.the_cocktail_db import DEFAULT_LETTERS, TheCocktailDbImporter


class Command(BaseCommand):
    help = (
        "Import cocktail catalog data into local Recipe / Ingredient rows. "
        "Register additional importers in SOURCE_IMPORTERS.\n\n"
        "Full refresh with hero + ingredient thumbnails (transparent PNG cutouts are ON by default; "
        "use --no-cutouts to skip rembg):\n"
        "  THECOCKTAILDB_API_VERSION=v2 THECOCKTAILDB_API_KEY=<patron> \\\n"
        "  python manage.py import_catalog --update --with-ingredient-images \\\n"
        "    --sync-all-ingredients --delay 0.35\n"
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
            help="Refresh recipes and ingredients that already have external refs for this source.",
        )
        parser.add_argument(
            "--skip-images",
            action="store_true",
            help="Do not download recipe hero images.",
        )
        parser.add_argument(
            "--with-ingredient-images",
            action="store_true",
            help="Download ingredient thumbnails from TheCocktailDB static URLs.",
        )
        parser.add_argument(
            "--no-cutouts",
            action="store_true",
            help=(
                "Skip rembg background removal (catalog defaults to transparent PNGs like member uploads)."
            ),
        )
        parser.add_argument(
            "--sync-all-ingredients",
            action="store_true",
            help=(
                "After recipes, walk list.php?i=list so every catalog ingredient gets a row "
                "(patron + v2 returns ~489; free key often ~100)."
            ),
        )
        parser.add_argument(
            "--delay",
            type=float,
            default=0.35,
            metavar="SEC",
            help="Pause between drinks / ingredient rows after HTTP work (default 0.35).",
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
        parser.add_argument(
            "--api-version",
            default=os.environ.get("THECOCKTAILDB_API_VERSION", "v1"),
            help="API path version v1 or v2 (default: env THECOCKTAILDB_API_VERSION or v1). Patron lists use v2.",
        )
        parser.add_argument(
            "--no-progress",
            action="store_true",
            help="Disable tqdm progress bars (letter discovery, recipes, ingredient list).",
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
            api_version=options["api_version"],
            cutouts=not options["no_cutouts"],
            sync_all_ingredients=options["sync_all_ingredients"],
            show_progress=not options["no_progress"],
        )
