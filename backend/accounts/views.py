import os

import requests
from django.conf import settings
from django.contrib.auth import get_user_model
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from jwt.exceptions import InvalidTokenError

from .oauth_verification import (
    facebook_debug_token,
    facebook_profile_from_token,
    synthetic_apple_placeholder_email,
    verify_apple_id_token,
)
from .permissions import IsStaffOperator, is_staff_operator
from .serializers import (
    AppleAuthSerializer,
    FacebookAuthSerializer,
    GoogleAuthSerializer,
    LoginSerializer,
    RegisterSerializer,
)

User = get_user_model()


def _reject_staff_consumer_login(user: User) -> Response | None:
    """Staff accounts must not use consumer registration or OAuth member endpoints."""
    if user.is_staff:
        return Response(
            {
                "detail": (
                    "This is a staff account. Sign in via the staff entry point, "
                    "not the public member login."
                )
            },
            status=status.HTTP_403_FORBIDDEN,
        )
    return None


def _user_payload(user: User) -> dict:
    name = (user.get_full_name() or user.first_name or user.email.split("@")[0]).strip()
    return {
        "id": str(user.pk),
        "email": user.email,
        "name": name or user.email.split("@")[0],
    }


def _issue_tokens(user: User) -> dict:
    refresh = RefreshToken.for_user(user)
    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "user": _user_payload(user),
    }


def _google_profile_from_access_token(access_token: str) -> dict | None:
    try:
        r = requests.get(
            "https://www.googleapis.com/oauth2/v3/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=15,
        )
    except requests.RequestException:
        return None
    if r.status_code != 200:
        return None
    return r.json()


def _upsert_oauth_user(
    email: str | None,
    name: str,
    *,
    apple_sub: str | None = None,
    facebook_sub: str | None = None,
) -> User:
    """Create or resolve a member from OAuth — same rules as legacy Google-only flow."""
    name = (name or "").strip()[:150] or "Member"

    user = None
    if apple_sub:
        user = User.objects.filter(apple_sub=apple_sub).first()
    if user is None and facebook_sub:
        user = User.objects.filter(facebook_sub=facebook_sub).first()

    email_norm = (email or "").lower().strip()
    if user is None and email_norm:
        user = User.objects.filter(username=email_norm).first()

    if user is None and not email_norm and apple_sub:
        email_norm = synthetic_apple_placeholder_email(apple_sub)

    if user:
        if not user.is_active:
            raise PermissionError("disabled")
        changed: list[str] = []
        if apple_sub and user.apple_sub != apple_sub:
            user.apple_sub = apple_sub
            changed.append("apple_sub")
        if facebook_sub and user.facebook_sub != facebook_sub:
            user.facebook_sub = facebook_sub
            changed.append("facebook_sub")
        if changed:
            user.save(update_fields=changed)
        return user

    if not email_norm:
        raise ValueError("missing_email")

    u = User.objects.create(
        username=email_norm[:150],
        email=email_norm,
        first_name=name[:150],
        apple_sub=apple_sub,
        facebook_sub=facebook_sub,
    )
    u.set_unusable_password()
    u.save()
    return u


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        ser = RegisterSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        user = ser.save()
        return Response(_issue_tokens(user), status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        ser = LoginSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        user = ser.validated_data["user"]
        blocked = _reject_staff_consumer_login(user)
        if blocked:
            return blocked
        return Response(_issue_tokens(user))


class GoogleAuthView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        client_id = getattr(settings, "GOOGLE_OAUTH_CLIENT_ID", "") or os.environ.get(
            "GOOGLE_OAUTH_CLIENT_ID", ""
        )
        if not client_id:
            return Response(
                {"detail": "Google sign-in is not configured on this server."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        ser = GoogleAuthSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        cred = ser.validated_data.get("credential")
        oauth_access = ser.validated_data.get("access_token")

        if cred:
            try:
                idinfo = id_token.verify_oauth2_token(
                    cred, google_requests.Request(), client_id
                )
            except ValueError:
                return Response(
                    {"detail": "Invalid Google credential."},
                    status=status.HTTP_401_UNAUTHORIZED,
                )

            if idinfo.get("iss") not in ("accounts.google.com", "https://accounts.google.com"):
                return Response(
                    {"detail": "Wrong token issuer."},
                    status=status.HTTP_401_UNAUTHORIZED,
                )

            email = (idinfo.get("email") or "").lower().strip()
            if not email:
                return Response(
                    {"detail": "Google did not return an email for this account."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            name = (idinfo.get("name") or idinfo.get("given_name") or email.split("@")[0])[:150]
        else:
            data = _google_profile_from_access_token(oauth_access)
            if not data:
                return Response(
                    {"detail": "Invalid or expired Google access token."},
                    status=status.HTTP_401_UNAUTHORIZED,
                )
            if data.get("email_verified") is False:
                return Response(
                    {"detail": "Google email is not verified."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            email = (data.get("email") or "").lower().strip()
            if not email:
                return Response(
                    {"detail": "Google did not return an email for this account."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            name = (data.get("name") or data.get("given_name") or email.split("@")[0])[:150]

        try:
            user = _upsert_oauth_user(email, name)
        except PermissionError:
            return Response(
                {"detail": "This account is disabled."},
                status=status.HTTP_403_FORBIDDEN,
            )

        blocked = _reject_staff_consumer_login(user)
        if blocked:
            return blocked

        return Response(_issue_tokens(user))


class AppleAuthView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        client_id = getattr(settings, "APPLE_CLIENT_ID", "") or os.environ.get("APPLE_CLIENT_ID", "")
        if not client_id:
            return Response(
                {"detail": "Apple sign-in is not configured on this server."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        ser = AppleAuthSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        raw = ser.validated_data["id_token"].strip()

        try:
            decoded = verify_apple_id_token(raw, client_id)
        except InvalidTokenError:
            return Response(
                {"detail": "Invalid Apple credential."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        apple_sub = (decoded.get("sub") or "").strip()
        if not apple_sub:
            return Response(
                {"detail": "Apple did not return a user id."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        email = (decoded.get("email") or "").strip() or None
        email_l = email.lower() if email else ""
        name = email_l.split("@")[0] if email_l else "Member"

        try:
            user = _upsert_oauth_user(email, name, apple_sub=apple_sub)
        except PermissionError:
            return Response(
                {"detail": "This account is disabled."},
                status=status.HTTP_403_FORBIDDEN,
            )
        except ValueError:
            return Response(
                {"detail": "Could not resolve an email for this Apple account."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        blocked = _reject_staff_consumer_login(user)
        if blocked:
            return blocked

        return Response(_issue_tokens(user))


class FacebookAuthView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        app_id = getattr(settings, "FACEBOOK_APP_ID", "") or os.environ.get("FACEBOOK_APP_ID", "")
        # Require app id; secret optional (stronger validation when set).
        if not app_id:
            return Response(
                {"detail": "Facebook sign-in is not configured on this server."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        ser = FacebookAuthSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        access_token = ser.validated_data["access_token"].strip()

        app_secret = getattr(settings, "FACEBOOK_APP_SECRET", "") or os.environ.get(
            "FACEBOOK_APP_SECRET", ""
        )
        if app_secret:
            dbg = facebook_debug_token(access_token, app_id, app_secret)
            if not dbg or not dbg.get("is_valid"):
                return Response(
                    {"detail": "Invalid or expired Facebook access token."},
                    status=status.HTTP_401_UNAUTHORIZED,
                )
            if str(dbg.get("app_id")) != str(app_id):
                return Response(
                    {"detail": "Facebook token is not for this application."},
                    status=status.HTTP_401_UNAUTHORIZED,
                )

        data = facebook_profile_from_token(access_token)
        if not data:
            return Response(
                {"detail": "Invalid or expired Facebook access token."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        fb_id = (data.get("id") or "").strip()
        if not fb_id:
            return Response(
                {"detail": "Facebook did not return a user id."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        email = (data.get("email") or "").strip()
        if not email:
            return Response(
                {
                    "detail": (
                        "Facebook did not return an email. "
                        "Grant email permission when signing in, or try another method."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        email = email.lower().strip()
        name = (data.get("name") or email.split("@")[0])[:150]

        try:
            user = _upsert_oauth_user(email, name, facebook_sub=fb_id)
        except PermissionError:
            return Response(
                {"detail": "This account is disabled."},
                status=status.HTTP_403_FORBIDDEN,
            )

        blocked = _reject_staff_consumer_login(user)
        if blocked:
            return blocked

        return Response(_issue_tokens(user))


class StaffLoginView(APIView):
    """Password login for operators (moderators / administrators). Consumer routes reject staff JWT."""

    permission_classes = [AllowAny]

    def post(self, request):
        ser = LoginSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        user = ser.validated_data["user"]
        if not user.is_staff:
            return Response(
                {"detail": "That account is not a staff user."},
                status=status.HTTP_403_FORBIDDEN,
            )
        if not is_staff_operator(user):
            return Response(
                {
                    "detail": (
                        "This staff account is not in the moderator or administrator group. "
                        "Ask an owner to assign you."
                    ),
                },
                status=status.HTTP_403_FORBIDDEN,
            )
        return Response(_issue_tokens(user))


class StaffPingView(APIView):
    """Minimal authenticated staff API — use as a template for moderator endpoints."""

    permission_classes = [IsStaffOperator]

    def get(self, request):
        return Response(
            {
                "staff": True,
                "email": request.user.email,
                "is_superuser": request.user.is_superuser,
            }
        )
