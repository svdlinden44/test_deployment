from django.contrib import admin
from django.contrib.contenttypes.admin import GenericTabularInline
from django.utils.html import format_html

from .models import (
    Bar,
    Category,
    Comment,
    Image,
    Ingredient,
    IngredientExternalRef,
    Rating,
    Recipe,
    RecipeExternalRef,
    RecipeIngredient,
)


def _thumb(obj, field="image", size=60):
    """Return an HTML <img> tag for the admin list/detail, or a dash if empty."""
    img = getattr(obj, field, None)
    if img:
        return format_html('<img src="{}" style="height:{}px; border-radius:4px;" />', img.url, size)
    return "—"


# ── Inlines ──

class RecipeIngredientInline(admin.TabularInline):
    model = RecipeIngredient
    extra = 3
    autocomplete_fields = ["ingredient"]


class RecipeExternalRefInline(admin.TabularInline):
    model = RecipeExternalRef
    extra = 0
    readonly_fields = ["source_key", "external_id", "metadata", "created_at", "updated_at"]
    can_delete = False


class IngredientExternalRefInline(admin.TabularInline):
    model = IngredientExternalRef
    extra = 0
    readonly_fields = ["source_key", "external_id", "metadata", "created_at", "updated_at"]
    can_delete = False


class RatingInline(admin.TabularInline):
    model = Rating
    extra = 0
    readonly_fields = ["user", "score", "created_at"]
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


class CommentInline(admin.StackedInline):
    model = Comment
    extra = 0
    readonly_fields = ["user", "created_at"]


class GalleryInline(GenericTabularInline):
    model = Image
    extra = 1
    fields = ["file", "caption", "sort_order", "preview"]
    readonly_fields = ["preview"]

    @admin.display(description="Preview")
    def preview(self, obj):
        return _thumb(obj, field="file", size=80)


# ── Model Admins ──

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "sort_order", "recipe_count"]
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ["name"]
    ordering = ["sort_order", "name"]

    @admin.display(description="Recipes")
    def recipe_count(self, obj):
        return obj.recipes.count()


@admin.register(Ingredient)
class IngredientAdmin(admin.ModelAdmin):
    list_display = ["name", "type", "abv", "thumb"]
    list_filter = ["type"]
    search_fields = ["name"]
    prepopulated_fields = {"slug": ("name",)}
    ordering = ["type", "name"]
    inlines = [IngredientExternalRefInline]

    @admin.display(description="Image")
    def thumb(self, obj):
        return _thumb(obj)


@admin.register(Recipe)
class RecipeAdmin(admin.ModelAdmin):
    list_display = [
        "thumb",
        "title",
        "category",
        "difficulty",
        "glass_type",
        "is_featured",
        "is_published",
        "avg_rating",
        "created_at",
    ]
    list_display_links = ["title"]
    list_filter = ["is_published", "is_featured", "difficulty", "category", "is_alcoholic"]
    search_fields = ["title", "description"]
    prepopulated_fields = {"slug": ("title",)}
    autocomplete_fields = ["category", "created_by"]
    readonly_fields = ["created_at", "updated_at", "image_preview"]
    inlines = [RecipeExternalRefInline, RecipeIngredientInline, GalleryInline, RatingInline, CommentInline]

    fieldsets = [
        (None, {"fields": ["title", "slug", "description", "instructions", "history"]}),
        ("Image", {"fields": ["image", "image_preview"]}),
        ("Classification", {"fields": ["category", "difficulty", "glass_type", "is_alcoholic"]}),
        ("Display", {"fields": ["prep_time_minutes", "is_featured", "is_published"]}),
        ("Metadata", {"fields": ["created_by", "created_at", "updated_at"]}),
    ]

    @admin.display(description="")
    def thumb(self, obj):
        return _thumb(obj, size=40)

    @admin.display(description="Rating")
    def avg_rating(self, obj):
        avg = obj.average_rating
        return f"{avg}★" if avg else "—"

    @admin.display(description="Current image")
    def image_preview(self, obj):
        return _thumb(obj, size=200)


@admin.register(Rating)
class RatingAdmin(admin.ModelAdmin):
    list_display = ["recipe", "user", "score", "created_at"]
    list_filter = ["score"]
    search_fields = ["recipe__title", "user__username"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ["recipe", "user", "short_body", "is_approved", "created_at"]
    list_filter = ["is_approved", "created_at"]
    search_fields = ["body", "recipe__title", "user__username"]
    readonly_fields = ["created_at", "updated_at"]
    actions = ["approve_comments", "reject_comments"]

    @admin.display(description="Comment")
    def short_body(self, obj):
        return obj.body[:80] + "…" if len(obj.body) > 80 else obj.body

    @admin.action(description="Approve selected comments")
    def approve_comments(self, request, queryset):
        queryset.update(is_approved=True)

    @admin.action(description="Reject selected comments")
    def reject_comments(self, request, queryset):
        queryset.update(is_approved=False)


@admin.register(Bar)
class BarAdmin(admin.ModelAdmin):
    list_display = ["thumb", "name", "city", "country", "is_featured", "is_published"]
    list_display_links = ["name"]
    list_filter = ["is_published", "is_featured", "country"]
    search_fields = ["name", "city", "country"]
    prepopulated_fields = {"slug": ("name",)}
    readonly_fields = ["created_at", "updated_at", "image_preview"]
    inlines = [GalleryInline]

    fieldsets = [
        (None, {"fields": ["name", "slug", "description"]}),
        ("Image", {"fields": ["image", "image_preview"]}),
        ("Location", {"fields": ["address", "city", "country", "latitude", "longitude"]}),
        ("Links", {"fields": ["website"]}),
        ("Display", {"fields": ["is_featured", "is_published"]}),
        ("Metadata", {"fields": ["created_at", "updated_at"]}),
    ]

    @admin.display(description="")
    def thumb(self, obj):
        return _thumb(obj, size=40)

    @admin.display(description="Current image")
    def image_preview(self, obj):
        return _thumb(obj, size=200)


@admin.register(Image)
class ImageAdmin(admin.ModelAdmin):
    list_display = ["thumb", "__str__", "content_type", "object_id", "created_at"]
    list_filter = ["content_type"]
    readonly_fields = ["preview", "created_at"]

    @admin.display(description="")
    def thumb(self, obj):
        return _thumb(obj, field="file", size=40)

    @admin.display(description="Preview")
    def preview(self, obj):
        return _thumb(obj, field="file", size=300)


