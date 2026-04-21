import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("cocktails", "0004_catalog_external_refs"),
    ]

    operations = [
        migrations.CreateModel(
            name="RecipeFavorite",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "recipe",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="favorited_by",
                        to="cocktails.recipe",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="recipe_favorites",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
        migrations.AddIndex(
            model_name="recipefavorite",
            index=models.Index(fields=["user", "recipe"], name="cocktails_r_user_id_fcaad5_idx"),
        ),
        migrations.AddIndex(
            model_name="recipefavorite",
            index=models.Index(fields=["user", "-created_at"], name="cocktails_r_user_id_6e7d01_idx"),
        ),
        migrations.AddConstraint(
            model_name="recipefavorite",
            constraint=models.UniqueConstraint(fields=("user", "recipe"), name="cocktails_recipefavorite_user_recipe_uniq"),
        ),
    ]
