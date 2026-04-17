from django.contrib.auth import authenticate
from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    name = serializers.CharField(max_length=150)

    def validate_email(self, value: str) -> str:
        email = value.lower().strip()
        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return email

    def create(self, validated_data):
        email = validated_data["email"]
        name = validated_data["name"].strip()
        return User.objects.create_user(
            username=email,
            email=email,
            password=validated_data["password"],
            first_name=name[:150],
        )


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs["email"].lower().strip()
        password = attrs["password"]
        user = authenticate(username=email, password=password)
        if not user:
            raise serializers.ValidationError({"detail": "Invalid email or password."})
        if not user.is_active:
            raise serializers.ValidationError({"detail": "This account is disabled."})
        attrs["user"] = user
        return attrs


class GoogleAuthSerializer(serializers.Serializer):
    """Exactly one of `credential` (GIS ID token) or `access_token` (OAuth userinfo flow)."""

    credential = serializers.CharField(required=False, allow_blank=True, default="")
    access_token = serializers.CharField(required=False, allow_blank=True, default="")

    def validate(self, attrs):
        cred = (attrs.get("credential") or "").strip()
        at = (attrs.get("access_token") or "").strip()
        if bool(cred) == bool(at):
            raise serializers.ValidationError(
                {"detail": "Provide either credential or access_token, not both or neither."}
            )
        attrs["credential"] = cred or None
        attrs["access_token"] = at or None
        return attrs
