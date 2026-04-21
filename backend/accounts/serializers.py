from django.contrib.auth import authenticate
from django.contrib.auth import get_user_model
from django.core.validators import FileExtensionValidator
from rest_framework import serializers

User = get_user_model()


def _avatar_url_representation(obj: User, request) -> str | None:
    if not getattr(obj, "avatar", None) or not obj.avatar:
        return None
    url = obj.avatar.url
    if isinstance(url, str) and url.startswith(("http://", "https://")):
        return url
    return request.build_absolute_uri(url)


class ProfileSerializer(serializers.ModelSerializer):
    """Member profile for GET responses."""

    name = serializers.CharField(source="first_name", max_length=150)
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ("email", "name", "avatar_url")
        read_only_fields = ("email",)

    def get_avatar_url(self, obj: User) -> str | None:
        req = self.context.get("request")
        if req is None:
            return None
        return _avatar_url_representation(obj, req)


class ProfileUpdateSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="first_name", max_length=150, required=False)

    avatar = serializers.ImageField(
        required=False,
        allow_null=True,
        validators=[
            FileExtensionValidator(
                allowed_extensions=("jpg", "jpeg", "png", "webp", "gif"),
            ),
        ],
    )

    class Meta:
        model = User
        fields = ("name", "avatar")

    def validate_avatar(self, value):
        if value and getattr(value, "size", 0) > 5 * 1024 * 1024:
            raise serializers.ValidationError("Image must be 5 MB or smaller.")
        return value


class PasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate_current_password(self, value: str) -> str:
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value

    def save(self) -> None:
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password"])


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


class AppleAuthSerializer(serializers.Serializer):
    id_token = serializers.CharField()


class FacebookAuthSerializer(serializers.Serializer):
    access_token = serializers.CharField()
