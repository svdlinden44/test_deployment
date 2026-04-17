from django.db.models import Count, Q
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny

from .models import Category, Ingredient, Recipe
from .serializers import (
    CategorySerializer,
    IngredientListSerializer,
    RecipeDetailSerializer,
    RecipeListSerializer,
)


class PublicPagination(PageNumberPagination):
    page_size = 24
    page_size_query_param = "per_page"
    max_page_size = 48


class IngredientPagination(PageNumberPagination):
    page_size = 80
    page_size_query_param = "per_page"
    max_page_size = 200


class RecipeListView(ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = RecipeListSerializer
    pagination_class = PublicPagination

    def get_queryset(self):
        qs = Recipe.objects.filter(is_published=True).select_related("category").order_by("-created_at")

        params = self.request.query_params

        q = params.get("search") or params.get("q")
        if q:
            qs = qs.filter(Q(title__icontains=q) | Q(description__icontains=q))

        cat = params.get("category")
        if cat:
            qs = qs.filter(category__slug=cat)

        diff = params.get("difficulty")
        if diff:
            qs = qs.filter(difficulty=diff)

        glass = params.get("glass")
        if glass:
            qs = qs.filter(glass_type=glass)

        alc = params.get("alcoholic")
        if alc is not None and alc != "":
            if alc.lower() in ("1", "true", "yes"):
                qs = qs.filter(is_alcoholic=True)
            elif alc.lower() in ("0", "false", "no"):
                qs = qs.filter(is_alcoholic=False)

        ingredient_slugs = params.getlist("ingredient")
        if ingredient_slugs:
            mode = (params.get("ingredient_match") or "any").lower()
            if mode == "all":
                for slug in ingredient_slugs:
                    qs = qs.filter(recipe_ingredients__ingredient__slug=slug)
                qs = qs.distinct()
            else:
                qs = qs.filter(recipe_ingredients__ingredient__slug__in=ingredient_slugs).distinct()

        return qs


class RecipeDetailView(RetrieveAPIView):
    permission_classes = [AllowAny]
    serializer_class = RecipeDetailSerializer
    lookup_field = "slug"

    def get_queryset(self):
        return (
            Recipe.objects.filter(is_published=True)
            .select_related("category")
            .prefetch_related("recipe_ingredients__ingredient")
        )


class IngredientSearchView(ListAPIView):
    """For filter UI — search ingredients by name."""

    permission_classes = [AllowAny]
    serializer_class = IngredientListSerializer
    pagination_class = IngredientPagination

    def get_queryset(self):
        qs = Ingredient.objects.all().order_by("name")
        q = self.request.query_params.get("search") or self.request.query_params.get("q")
        if q:
            qs = qs.filter(name__icontains=q)
        return qs


class CategoryListView(ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = CategorySerializer
    pagination_class = None
    queryset = Category.objects.annotate(
        recipe_count=Count("recipes", filter=Q(recipes__is_published=True))
    ).order_by("sort_order", "name")
