from rest_framework.permissions import BasePermission


# Group names — created by migration `0002_staff_groups`.
STAFF_GROUP_MODERATOR = "Staff Moderator"
STAFF_GROUP_ADMINISTRATOR = "Staff Administrator"


def is_staff_operator(user) -> bool:
    if not user.is_authenticated or not user.is_staff:
        return False
    if user.is_superuser:
        return True
    return user.groups.filter(
        name__in=[STAFF_GROUP_MODERATOR, STAFF_GROUP_ADMINISTRATOR]
    ).exists()


def is_staff_administrator(user) -> bool:
    if not user.is_authenticated or not user.is_staff:
        return False
    if user.is_superuser:
        return True
    return user.groups.filter(name=STAFF_GROUP_ADMINISTRATOR).exists()


class IsMemberOnly(BasePermission):
    """
    Authenticated users who are not Django staff (consumer app).
    """

    def has_permission(self, request, view):
        u = request.user
        return bool(
            u
            and u.is_authenticated
            and u.is_active
            and not u.is_staff
        )


class IsStaffOperator(BasePermission):
    """
    Staff users in the moderator or administrator group (or superuser).
    Authenticated API for in-app moderator tools + staff-specific views.
    """

    def has_permission(self, request, view):
        u = request.user
        return bool(u and u.is_active and is_staff_operator(u))


class IsStaffAdministrator(BasePermission):
    """Administrators or superusers (broader operational access)."""

    def has_permission(self, request, view):
        u = request.user
        return bool(u and u.is_active and is_staff_administrator(u))
