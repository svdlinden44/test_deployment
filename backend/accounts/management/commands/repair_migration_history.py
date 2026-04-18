"""
Fix InconsistentMigrationHistory when apps that depend on accounts.User were
recorded before accounts.0001_initial (e.g. admin or cocktails).

Deploying with AUTH_USER_MODEL = accounts.User requires accounts.0001_initial first.
Old or restored DBs can list admin/cocktails as applied without accounts.

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


# Apps whose initial migrations depend on AUTH_USER_MODEL in this project.
_STRIP_BEFORE_ACCOUNTS_INITIAL = ("admin", "cocktails")


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

        # Recorded apps that depend on accounts.User before accounts.0001 — strip those
        # rows so migrate can replay in dependency order.
        if not _accounts_initial_applied():
            placeholders = ",".join(["%s"] * len(_STRIP_BEFORE_ACCOUNTS_INITIAL))
            with connection.cursor() as cursor:
                cursor.execute(
                    f"DELETE FROM django_migrations WHERE app IN ({placeholders})",
                    list(_STRIP_BEFORE_ACCOUNTS_INITIAL),
                )
                deleted = cursor.rowcount if cursor.rowcount is not None else 0
            if deleted:
                self.stdout.write(
                    self.style.WARNING(
                        f"Removed {deleted} migration row(s) for apps "
                        f"{', '.join(_STRIP_BEFORE_ACCOUNTS_INITIAL)} from django_migrations."
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
