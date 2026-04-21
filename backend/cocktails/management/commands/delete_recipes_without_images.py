"""Delete Recipe rows where the hero ImageField is unset (catalog or member)."""

from django.core.management.base import BaseCommand
from django.db.models import Q

from cocktails.models import Recipe


class Command(BaseCommand):
    help = (
        "Delete recipes with no hero image (empty ImageField). "
        "Related rows (favorites, wishlist, refs, ingredients M2M) cascade. "
        "Use --dry-run to list without deleting."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Print slugs/titles that would be removed without deleting.",
        )

    def handle(self, *args, **options):
        dry_run: bool = options["dry_run"]
        qs = Recipe.objects.filter(Q(image="") | Q(image__isnull=True)).order_by("pk")
        total = qs.count()

        if total == 0:
            self.stdout.write(self.style.SUCCESS("No recipes without images."))
            return

        self.stdout.write(f"Found {total} recipe(s) with no hero image.")

        if dry_run:
            for r in qs.iterator():
                self.stdout.write(f"  [dry-run] {r.pk}  {r.slug}  {r.title!r}")
            self.stdout.write(self.style.WARNING("Dry run only — no rows deleted."))
            return

        titles = list(qs.values_list("pk", "slug", "title")[:50])
        deleted_total, deleted_by_model = qs.delete()

        self.stdout.write(
            self.style.WARNING(
                f"Deleted {total} recipe(s). ORM cascade total objects removed: {deleted_total}. "
                f"(Per-model breakdown: {deleted_by_model})"
            )
        )
        for row in titles:
            self.stdout.write(f"  removed  {row[0]}  {row[1]}  {row[2]!r}")
        if total > 50:
            self.stdout.write(f"  … and {total - 50} more.")

        self.stdout.write(self.style.SUCCESS("Done."))
