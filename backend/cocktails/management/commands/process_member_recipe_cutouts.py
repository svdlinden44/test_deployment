"""Re-run background removal on stored member recipe images (backfill)."""

from django.core.management.base import BaseCommand

from cocktails.image_pipeline import apply_recipe_image_cutout
from cocktails.models import Recipe


class Command(BaseCommand):
    help = "Replace member recipe images with PNG cutouts (rembg when installed)."

    def handle(self, *args, **options):
        qs = Recipe.objects.filter(source=Recipe.Source.MEMBER).exclude(image="")
        total = qs.count()
        ok = 0
        for recipe in qs.iterator(chunk_size=50):
            label = apply_recipe_image_cutout(recipe)
            if label:
                ok += 1
                self.stdout.write(f"{recipe.slug}: {label}")
            else:
                self.stdout.write(self.style.WARNING(f"{recipe.slug}: skipped or failed"))
        self.stdout.write(self.style.SUCCESS(f"Processed {ok}/{total} recipes with images."))
