from django.db import migrations

# Must match accounts.permissions (duplicated here to avoid DRF imports at migrate time).
_STAFF_MODERATOR = "Staff Moderator"
_STAFF_ADMIN = "Staff Administrator"


def create_staff_groups(apps, schema_editor):
    Group = apps.get_model("auth", "Group")
    for name in (_STAFF_MODERATOR, _STAFF_ADMIN):
        Group.objects.get_or_create(name=name)


def remove_staff_groups(apps, schema_editor):
    Group = apps.get_model("auth", "Group")
    Group.objects.filter(name__in=(_STAFF_MODERATOR, _STAFF_ADMIN)).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(create_staff_groups, remove_staff_groups),
    ]
