from rest_framework import serializers

from .models import Category, Ingredient, Recipe, RecipeIngredient


class CategoryMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("slug", "name")


class RecipeListSerializer(serializers.ModelSerializer):
    category = CategoryMiniSerializer(read_only=True)
    image_url = serializers.SerializerMethodField()

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
        )

    def get_image_url(self, obj: Recipe) -> str | None:
        if not obj.image:
            return None
        request = self.context.get("request")
        url = obj.image.url
        if request:
            return request.build_absolute_uri(url)
        return url


class RecipeIngredientSerializer(serializers.ModelSerializer):
    ingredient_name = serializers.CharField(source="ingredient.name", read_only=True)
    ingredient_slug = serializers.CharField(source="ingredient.slug", read_only=True)

    class Meta:
        model = RecipeIngredient
        fields = ("quantity", "unit", "notes", "sort_order", "ingredient_name", "ingredient_slug")


class RecipeDetailSerializer(RecipeListSerializer):
    ingredients = RecipeIngredientSerializer(source="recipe_ingredients", many=True, read_only=True)

    class Meta(RecipeListSerializer.Meta):
        fields = RecipeListSerializer.Meta.fields + ("instructions", "history", "ingredients")


class IngredientListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ingredient
        fields = ("id", "slug", "name", "type")


class CategorySerializer(serializers.ModelSerializer):
    recipe_count = serializers.IntegerField(read_only=True, required=False)

    class Meta:
        model = Category
        fields = ("slug", "name", "sort_order", "recipe_count")
