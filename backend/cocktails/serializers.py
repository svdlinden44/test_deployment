from rest_framework import serializers

from .models import (
    Category,
    Ingredient,
    Rating,
    Recipe,
    RecipeIngredient,
    RecipeWishlist,
)
from .utils_recipe import generate_member_recipe_slug
from .validators import validate_half_star_rating_serializer


def _favorite_exists(user, recipe_id: int) -> bool:
    from .models import RecipeFavorite

    return RecipeFavorite.objects.filter(user=user, recipe_id=recipe_id).exists()


def _wishlist_exists(user, recipe_id: int) -> bool:
    return RecipeWishlist.objects.filter(user=user, recipe_id=recipe_id).exists()


class CategoryMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("slug", "name")


class RecipeListSerializer(serializers.ModelSerializer):
    category = CategoryMiniSerializer(read_only=True)
    image_url = serializers.SerializerMethodField()
    is_favorited = serializers.SerializerMethodField()
    is_wishlisted = serializers.SerializerMethodField()
    recipe_source = serializers.CharField(source="source", read_only=True)
    average_rating = serializers.SerializerMethodField()
    rating_count = serializers.SerializerMethodField()

    class Meta:
        model = Recipe
        fields = (
            "id",
            "slug",
            "title",
            "description",
            "category",
            "difficulty",
            "glass_type",
            "prep_time_minutes",
            "is_alcoholic",
            "image_url",
            "is_favorited",
            "is_wishlisted",
            "recipe_source",
            "average_rating",
            "rating_count",
        )

    def get_image_url(self, obj: Recipe) -> str | None:
        if not obj.image:
            return None
        request = self.context.get("request")
        url = obj.image.url
        if request:
            return request.build_absolute_uri(url)
        return url

    def get_is_favorited(self, obj: Recipe) -> bool:
        if getattr(obj, "is_favorited", None) is not None:
            return bool(obj.is_favorited)
        request = self.context.get("request")
        if not request or not getattr(request.user, "is_authenticated", False):
            return False
        return _favorite_exists(request.user, obj.pk)

    def get_is_wishlisted(self, obj: Recipe) -> bool:
        if getattr(obj, "is_wishlisted", None) is not None:
            return bool(obj.is_wishlisted)
        request = self.context.get("request")
        if not request or not getattr(request.user, "is_authenticated", False):
            return False
        return _wishlist_exists(request.user, obj.pk)

    def get_average_rating(self, obj: Recipe) -> float | None:
        v = getattr(obj, "_rating_avg", None)
        if v is not None:
            return round(float(v), 2)
        prop = getattr(obj, "average_rating", None)
        return round(float(prop), 2) if prop is not None else None

    def get_rating_count(self, obj: Recipe) -> int:
        rc = getattr(obj, "_rating_count", None)
        if rc is not None:
            return int(rc)
        return int(obj.rating_count)


class RecipeIngredientSerializer(serializers.ModelSerializer):
    ingredient_name = serializers.CharField(source="ingredient.name", read_only=True)
    ingredient_slug = serializers.CharField(source="ingredient.slug", read_only=True)

    class Meta:
        model = RecipeIngredient
        fields = ("quantity", "unit", "notes", "sort_order", "ingredient_name", "ingredient_slug")


class RecipeDetailSerializer(RecipeListSerializer):
    ingredients = RecipeIngredientSerializer(source="recipe_ingredients", many=True, read_only=True)
    my_rating = serializers.SerializerMethodField()
    average_rating = serializers.FloatField(read_only=True, allow_null=True)
    rating_count = serializers.IntegerField(read_only=True)

    class Meta(RecipeListSerializer.Meta):
        fields = RecipeListSerializer.Meta.fields + (
            "instructions",
            "history",
            "ingredients",
            "my_rating",
            "average_rating",
            "rating_count",
        )

    def get_my_rating(self, obj: Recipe) -> float | None:
        request = self.context.get("request")
        if not request or not getattr(request.user, "is_authenticated", False):
            return None
        row = Rating.objects.filter(user=request.user, recipe=obj).first()
        return float(row.score) if row else None


class MemberRecipeCreateSerializer(serializers.ModelSerializer):
    """Minimal personal recipe — saved as MEMBER source."""

    _MAX_IMAGE_BYTES = 10 * 1024 * 1024

    class Meta:
        model = Recipe
        fields = ("title", "description", "instructions", "image")
        extra_kwargs = {"image": {"required": False, "allow_null": True}}

    def validate_image(self, value):
        if value and value.size > self._MAX_IMAGE_BYTES:
            raise serializers.ValidationError("Image must be 10 MB or smaller.")
        return value

    def validate_title(self, value: str) -> str:
        v = value.strip()
        if len(v) < 2:
            raise serializers.ValidationError("Title must be at least 2 characters.")
        return v[:250]

    def create(self, validated_data):
        request = self.context["request"]
        user = request.user
        title = validated_data["title"].strip()[:250]
        slug = generate_member_recipe_slug(title, user.pk)
        image = validated_data.pop("image", None)
        kwargs = dict(
            title=title,
            slug=slug,
            description=validated_data["description"].strip(),
            instructions=validated_data["instructions"].strip(),
            history="",
            source=Recipe.Source.MEMBER,
            created_by=user,
            is_published=False,
            is_public=False,
        )
        if image:
            kwargs["image"] = image
        return Recipe.objects.create(**kwargs)


class RatingUpsertSerializer(serializers.Serializer):
    score = serializers.DecimalField(max_digits=2, decimal_places=1)

    def validate_score(self, value):
        validate_half_star_rating_serializer(value)
        return value


class IngredientListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ingredient
        fields = ("id", "slug", "name", "type")


class IngredientBrowseSerializer(serializers.ModelSerializer):
    """Ingredient grid / cabinet — hero image URL + membership flag."""

    image_url = serializers.SerializerMethodField()
    is_in_cabinet = serializers.SerializerMethodField()

    class Meta:
        model = Ingredient
        fields = ("id", "slug", "name", "type", "description", "image_url", "is_in_cabinet")

    def get_image_url(self, obj: Ingredient) -> str | None:
        if not obj.image:
            return None
        request = self.context.get("request")
        url = obj.image.url
        if request:
            return request.build_absolute_uri(url)
        return url

    def get_is_in_cabinet(self, obj: Ingredient) -> bool:
        if getattr(obj, "is_in_cabinet", None) is not None:
            return bool(obj.is_in_cabinet)
        request = self.context.get("request")
        if not request or not getattr(request.user, "is_authenticated", False):
            return False
        from .models import UserCabinetIngredient

        return UserCabinetIngredient.objects.filter(user=request.user, ingredient_id=obj.pk).exists()


class CategorySerializer(serializers.ModelSerializer):
    recipe_count = serializers.IntegerField(read_only=True, required=False)

    class Meta:
        model = Category
        fields = ("slug", "name", "sort_order", "recipe_count")
