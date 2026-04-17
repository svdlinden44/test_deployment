"""
Fix InconsistentMigrationHistory when django_migrations lists admin before accounts.

Deploying with AUTH_USER_MODEL = accounts.User requires accounts.0001_initial to be
applied before django.contrib.admin. Old or restored DBs sometimes only record admin.

Safe to run on every boot: no-ops when history is already consistent.
"""

from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.db import connection
from django.db.migrations.exceptions import InconsistentMigrationHistory
from django.db.migrations.loader import MigrationLoader
from django.db.migrations.recorder import MigrationRecorder


def _history_consistent() -> bool:
    loader = MigrationLoader(connection)
    try:
        loader.check_consistent_history(connection)
    except InconsistentMigrationHistory:
        return False
    return True


def _accounts_initial_applied() -> bool:
    recorder = MigrationRecorder(connection)
    applied = recorder.applied_migrations()
    return ("accounts", "0001_initial") in applied


def _admin_migration_rows_exist() -> bool:
    recorder = MigrationRecorder(connection)
    applied = recorder.applied_migrations()
    return any(app == "admin" for app, _ in applied)


class Command(BaseCommand):
    help = (
        "Repairs django_migrations when admin was recorded before accounts "
        "(custom User model). Use --execute to apply."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--execute",
            action="store_true",
            help="Apply fix (delete admin migration rows and run migrate --fake-initial).",
        )

    def handle(self, *args, **options):
        execute = options["execute"]

        if _history_consistent():
            self.stdout.write("Migration history is consistent.")
            return

        self.stdout.write(
            self.style.WARNING(
                "Inconsistent migration history detected "
                "(often admin.* applied before accounts.0001_initial)."
            )
        )

        if not execute:
            self.stdout.write(
                "Re-run with --execute to repair (safe on boot when followed by migrate)."
            )
            return

        # Targeted fix: admin recorded without accounts initial — remove admin rows so
        # migrate can apply the graph in dependency order.
        if not _accounts_initial_applied() and _admin_migration_rows_exist():
            with connection.cursor() as cursor:
                cursor.execute("DELETE FROM django_migrations WHERE app = %s", ["admin"])
                deleted = cursor.rowcount if cursor.rowcount is not None else 0
            self.stdout.write(
                self.style.WARNING(
                    f"Removed {deleted} django.contrib.admin migration row(s) from django_migrations."
                )
            )

        try:
            call_command(
                "migrate",
                interactive=False,
                verbosity=1,
                fake_initial=True,
            )
        except Exception:
            self.stdout.write(
                self.style.ERROR(
                    "migrate failed after repair. Likely mixed schema from an old DB — "
                    "reset the Postgres database on Railway and redeploy."
                )
            )
            raise

        if not _history_consistent():
            self.stdout.write(
                self.style.ERROR(
                    "Migration history is still inconsistent. "
                    "Create a fresh Railway Postgres volume (or drop all public schema tables) "
                    "and redeploy so migrate can run cleanly."
                )
            )
            raise SystemExit(1)

        self.stdout.write(self.style.SUCCESS("Migration history repaired successfully."))
