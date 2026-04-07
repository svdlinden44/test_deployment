from django.contrib.auth.hashers import make_password
from django.db import migrations


def create_superuser(apps, schema_editor):
    User = apps.get_model("auth", "User")
    if not User.objects.filter(username="sander").exists():
        User.objects.create(
            username="sander",
            password=make_password("welcome"),
            is_superuser=True,
            is_staff=True,
            is_active=True,
        )


def remove_superuser(apps, schema_editor):
    User = apps.get_model("auth", "User")
    User.objects.filter(username="sander").delete()


class Migration(migrations.Migration):
    dependencies = [
        ("cocktails", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(create_superuser, remove_superuser),
    ]
