"""
Stable string keys for catalog importers.

Each seeder registers under a unique `source_key`. New sources add a constant here
and register in `cocktails.management.commands.import_catalog.SOURCE_IMPORTERS`.
"""

THECOCKTAILDB = "thecocktaildb"
