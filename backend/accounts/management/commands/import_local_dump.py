"""
Load a dumpdata JSON fixture created from the local SQLite DB onto Postgres.

Usage (Railway, ONE-TIME after resetting Postgres & deploying):
  ALLOW_DESTRUCTIVE_IMPORT=1 python manage.py import_local_dump fixtures/railway_sync.json

Steps before this command:
  1. Reset Railway Postgres (empty DB) OR drop all public schema tables + django_migrations (advanced).
  2. Deploy so migrate runs cleanly (fixes prior inconsistent migration history).
  3. Copy fixtures/railway_sync.json into the backend release (commit or upload).
  4. Run this command with ALLOW_DESTRUCTIVE_IMPORT=1 — it flush()es ALL data then loaddata + sequence reset.
"""

import os

from django.conf import settings
from django.core.management import BaseCommand, CommandError, call_command
from django.db import connection


def _reset_postgres_sequences() -> None:
    if connection.vendor != "postgresql":
        return
    from io import StringIO

    buf = StringIO()
    labels = ["accounts", "auth", "contenttypes", "admin", "sessions", "cocktails"]
    call_command("sqlsequencereset", *labels, stdout=buf)
    sql = buf.getvalue()
    if not sql.strip():
        return
    with connection.cursor() as cursor:
        for chunk in sql.split(";"):
            stmt = chunk.strip()
            if stmt:
                cursor.execute(stmt)


class Command(BaseCommand):
    help = "Flush database and load a JSON fixture (for cloning local DB to Railway Postgres)."

    def add_arguments(self, parser):
        parser.add_argument(
            "fixture",
            nargs="?",
            default="fixtures/railway_sync.json",
            help="Path to dumpdata JSON (default: fixtures/railway_sync.json)",
        )
        parser.add_argument(
            "--skip-flush",
            action="store_true",
            help="Do not flush (only use if DB is already empty)",
        )

    def handle(self, *args, **options):
        if not settings.DEBUG and os.environ.get("ALLOW_DESTRUCTIVE_IMPORT", "").strip() != "1":
            raise CommandError(
                "Refusing destructive import: set ALLOW_DESTRUCTIVE_IMPORT=1 "
                "(and only run on a DB you intend to overwrite)."
            )

        fixture = options["fixture"]
        skip_flush = options["skip_flush"]

        if not skip_flush:
            self.stdout.write(self.style.WARNING("Flushing all data…"))
            call_command("flush", verbosity=1, interactive=False)

        self.stdout.write(f"Loading fixture {fixture}…")
        call_command("loaddata", fixture, verbosity=1)

        self.stdout.write("Resetting PostgreSQL sequences…")
        _reset_postgres_sequences()

        self.stdout.write(self.style.SUCCESS("Import finished."))
