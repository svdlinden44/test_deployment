from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Single auth table for the project. Members and staff are different rows:
    members have is_staff=False; operators have is_staff=True and group membership.
    """

    email = models.EmailField("email address", unique=True)

    class Meta:
        db_table = "accounts_user"
