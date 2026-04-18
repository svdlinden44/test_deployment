"""Verify third-party OAuth tokens for Sign in with Apple and Facebook."""

from __future__ import annotations

import hashlib
import logging
from typing import Any

import jwt
import requests
from jwt import PyJWKClient

logger = logging.getLogger(__name__)

APPLE_ISSUER = "https://appleid.apple.com"
APPLE_JWKS_URL = "https://appleid.apple.com/auth/keys"


def synthetic_apple_placeholder_email(apple_sub: str) -> str:
    """Stable synthetic email when Apple omits email in the ID token (rare)."""
    h = hashlib.sha256(apple_sub.encode()).hexdigest()[:32]
    return f"apple_{h}@oauth.invalid"


def verify_apple_id_token(id_token: str, client_id: str) -> dict[str, Any]:
    """Validate Apple identity JWT; `client_id` is the Services ID (web)."""
    jwks_client = PyJWKClient(APPLE_JWKS_URL)
    signing_key = jwks_client.get_signing_key_from_jwt(id_token)
    decoded = jwt.decode(
        id_token,
        signing_key.key,
        algorithms=["RS256"],
        audience=client_id,
        issuer=APPLE_ISSUER,
        options={"require": ["exp", "iat", "sub"]},
    )
    return decoded


def facebook_debug_token(user_access_token: str, app_id: str, app_secret: str) -> dict[str, Any] | None:
    """Validate that the user token was issued for our Facebook app."""
    app_access = f"{app_id}|{app_secret}"
    try:
        r = requests.get(
            "https://graph.facebook.com/debug_token",
            params={"input_token": user_access_token, "access_token": app_access},
            timeout=15,
        )
    except requests.RequestException as e:
        logger.warning("Facebook debug_token request failed: %s", e)
        return None
    if r.status_code != 200:
        return None
    data = r.json()
    inner = data.get("data") if isinstance(data, dict) else None
    return inner if isinstance(inner, dict) else None


def facebook_profile_from_token(access_token: str) -> dict[str, Any] | None:
    try:
        r = requests.get(
            "https://graph.facebook.com/me",
            params={"fields": "id,name,email", "access_token": access_token},
            timeout=15,
        )
    except requests.RequestException as e:
        logger.warning("Facebook /me request failed: %s", e)
        return None
    if r.status_code != 200:
        return None
    data = r.json()
    return data if isinstance(data, dict) else None
