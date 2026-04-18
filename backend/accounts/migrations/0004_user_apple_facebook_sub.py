from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0003_alter_user_options"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="apple_sub",
            field=models.CharField(
                blank=True,
                db_index=True,
                max_length=255,
                null=True,
                unique=True,
                verbose_name="Apple ID subject",
            ),
        ),
        migrations.AddField(
            model_name="user",
            name="facebook_sub",
            field=models.CharField(
                blank=True,
                db_index=True,
                max_length=255,
                null=True,
                unique=True,
                verbose_name="Facebook user ID",
            ),
        ),
    ]
