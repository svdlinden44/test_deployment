from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Single auth table for the project. Members and staff are different rows:
    members have is_staff=False; operators have is_staff=True and group membership.
    """

    email = models.EmailField("email address", unique=True)
    apple_sub = models.CharField(
        "Apple ID subject",
        max_length=255,
        blank=True,
        null=True,
        unique=True,
        db_index=True,
    )
    facebook_sub = models.CharField(
        "Facebook user ID",
        max_length=255,
        blank=True,
        null=True,
        unique=True,
        db_index=True,
    )

    class Meta:
        db_table = "accounts_user"
