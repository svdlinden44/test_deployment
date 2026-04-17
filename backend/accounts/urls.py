from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    GoogleAuthView,
    LoginView,
    RegisterView,
    StaffLoginView,
    StaffPingView,
)

urlpatterns = [
    path("auth/register/", RegisterView.as_view(), name="auth-register"),
    path("auth/login/", LoginView.as_view(), name="auth-login"),
    path("auth/google/", GoogleAuthView.as_view(), name="auth-google"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="auth-token-refresh"),
    path("staff/auth/login/", StaffLoginView.as_view(), name="staff-auth-login"),
    path("staff/ping/", StaffPingView.as_view(), name="staff-ping"),
]
