from django.http import HttpResponse
from django.db.models import Avg, BooleanField, Count, Exists, OuterRef, Q, Value
from rest_framework import status
from rest_framework.generics import ListAPIView, ListCreateAPIView, RetrieveAPIView
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Category, Ingredient, Rating, Recipe, RecipeFavorite, RecipeWishlist
from .image_pipeline import apply_recipe_image_cutout, preview_recipe_image
from .serializers import (
    CategorySerializer,
    IngredientListSerializer,
    MemberRecipeCreateSerializer,
    RecipeDetailSerializer,
    RecipeListSerializer,
    RatingUpsertSerializer,
)
from .utils_recipe import get_recipe_for_member_actions


def _recipe_rating_snapshot(recipe: Recipe) -> dict:
    agg = recipe.ratings.aggregate(avg=Avg("score"))
    raw = agg["avg"]
    cnt = recipe.ratings.count()
    return {
        "average_rating": round(float(raw), 2) if raw is not None else None,
        "rating_count": cnt,
    }


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
        qs = (
            Recipe.objects.filter(is_published=True, source=Recipe.Source.CATALOG)
            .select_related("category")
            .order_by("-created_at")
        )

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

        user = self.request.user
        if user.is_authenticated:
            fav = RecipeFavorite.objects.filter(user=user, recipe_id=OuterRef("pk"))
            wl = RecipeWishlist.objects.filter(user=user, recipe_id=OuterRef("pk"))
            qs = qs.annotate(is_favorited=Exists(fav), is_wishlisted=Exists(wl))
        qs = qs.annotate(_rating_avg=Avg("ratings__score"), _rating_count=Count("ratings"))
        return qs


class RecipeDetailView(RetrieveAPIView):
    permission_classes = [AllowAny]
    serializer_class = RecipeDetailSerializer
    lookup_field = "slug"

    def get_queryset(self):
        from .utils_recipe import accessible_recipes_queryset

        return accessible_recipes_queryset(self.request)


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
        recipe_count=Count(
            "recipes",
            filter=Q(recipes__is_published=True, recipes__source=Recipe.Source.CATALOG),
        )
    ).order_by("sort_order", "name")


class MyFavoritesListView(ListAPIView):
    """Paginated favorited recipes (newest saves first)."""

    permission_classes = [IsAuthenticated]
    serializer_class = RecipeListSerializer
    pagination_class = PublicPagination

    def get_queryset(self):
        user = self.request.user
        fav = RecipeFavorite.objects.filter(user=user, recipe_id=OuterRef("pk"))
        wl = RecipeWishlist.objects.filter(user=user, recipe_id=OuterRef("pk"))
        return (
            Recipe.objects.filter(favorited_by__user=user)
            .select_related("category")
            .annotate(
                is_favorited=Value(True, output_field=BooleanField()),
                is_wishlisted=Exists(wl),
                _rating_avg=Avg("ratings__score"),
                _rating_count=Count("ratings"),
            )
            .order_by("-favorited_by__created_at")
        )


class FavoriteDetailView(APIView):
    """POST to save, DELETE to remove — by recipe slug."""

    permission_classes = [IsAuthenticated]

    def post(self, request, slug: str):
        recipe = get_recipe_for_member_actions(request, slug)
        _, created = RecipeFavorite.objects.get_or_create(user=request.user, recipe=recipe)
        out = RecipeListSerializer(recipe, context={"request": request})
        data = dict(out.data)
        data["is_favorited"] = True
        return Response(
            data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    def delete(self, request, slug: str):
        recipe = get_recipe_for_member_actions(request, slug)
        RecipeFavorite.objects.filter(user=request.user, recipe=recipe).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MyWishlistListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = RecipeListSerializer
    pagination_class = PublicPagination

    def get_queryset(self):
        user = self.request.user
        fav = RecipeFavorite.objects.filter(user=user, recipe_id=OuterRef("pk"))
        wl = RecipeWishlist.objects.filter(user=user, recipe_id=OuterRef("pk"))
        return (
            Recipe.objects.filter(wishlisted_by__user=user)
            .select_related("category")
            .annotate(
                is_wishlisted=Value(True, output_field=BooleanField()),
                is_favorited=Exists(fav),
                _rating_avg=Avg("ratings__score"),
                _rating_count=Count("ratings"),
            )
            .order_by("-wishlisted_by__created_at")
        )


class WishlistDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, slug: str):
        recipe = get_recipe_for_member_actions(request, slug)
        _, created = RecipeWishlist.objects.get_or_create(user=request.user, recipe=recipe)
        out = RecipeListSerializer(recipe, context={"request": request})
        data = dict(out.data)
        data["is_wishlisted"] = True
        return Response(
            data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    def delete(self, request, slug: str):
        recipe = get_recipe_for_member_actions(request, slug)
        RecipeWishlist.objects.filter(user=request.user, recipe=recipe).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


_PREVIEW_MAX_BYTES = 10 * 1024 * 1024


class RecipeImagePreviewView(APIView):
    """POST multipart `image` → PNG preview bytes (same pipeline logic as eventual save processing)."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        f = request.FILES.get("image")
        if not f:
            return Response({"detail": "Missing image."}, status=status.HTTP_400_BAD_REQUEST)
        raw = f.read()
        if len(raw) > _PREVIEW_MAX_BYTES:
            return Response({"detail": "Image must be 10 MB or smaller."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            out_bytes, pipeline = preview_recipe_image(raw)
        except Exception:
            return Response(
                {"detail": "Could not read this image. Try JPEG, PNG, WebP, or GIF."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        resp = HttpResponse(out_bytes, content_type="image/png")
        resp["X-Preview-Pipeline"] = pipeline
        resp["Cache-Control"] = "no-store"
        return resp


class MemberRecipeListCreateView(ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    pagination_class = PublicPagination

    def get_serializer_class(self):
        if self.request.method == "POST":
            return MemberRecipeCreateSerializer
        return RecipeListSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        recipe = serializer.save()
        if recipe.image:
            apply_recipe_image_cutout(recipe)
            recipe.refresh_from_db()
        out = RecipeListSerializer(recipe, context={"request": request})
        headers = self.get_success_headers(out.data)
        return Response(out.data, status=status.HTTP_201_CREATED, headers=headers)

    def get_queryset(self):
        user = self.request.user
        fav = RecipeFavorite.objects.filter(user=user, recipe_id=OuterRef("pk"))
        wl = RecipeWishlist.objects.filter(user=user, recipe_id=OuterRef("pk"))
        return (
            Recipe.objects.filter(source=Recipe.Source.MEMBER, created_by=user)
            .select_related("category")
            .annotate(
                is_favorited=Exists(fav),
                is_wishlisted=Exists(wl),
                _rating_avg=Avg("ratings__score"),
                _rating_count=Count("ratings"),
            )
            .order_by("-created_at")
        )


class RecipeRatingView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, slug: str):
        recipe = get_recipe_for_member_actions(request, slug)
        row = Rating.objects.filter(user=request.user, recipe=recipe).first()
        return Response({"score": float(row.score)} if row else {"score": None})

    def put(self, request, slug: str):
        return self._upsert(request, slug)

    def patch(self, request, slug: str):
        return self._upsert(request, slug)

    def _upsert(self, request, slug: str):
        recipe = get_recipe_for_member_actions(request, slug)
        ser = RatingUpsertSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        score = ser.validated_data["score"]
        Rating.objects.update_or_create(
            user=request.user,
            recipe=recipe,
            defaults={"score": score},
        )
        snap = _recipe_rating_snapshot(recipe)
        return Response({"score": float(score), **snap})

    def delete(self, request, slug: str):
        recipe = get_recipe_for_member_actions(request, slug)
        Rating.objects.filter(user=request.user, recipe=recipe).delete()
        snap = _recipe_rating_snapshot(recipe)
        return Response({"score": None, **snap})
