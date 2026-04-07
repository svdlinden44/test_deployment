from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User

from .models import Bar, Category, Comment, Ingredient, Rating, Recipe, RecipeIngredient


# ── Inlines ──

class RecipeIngredientInline(admin.TabularInline):
    model = RecipeIngredient
    extra = 3
    autocomplete_fields = ["ingredient"]


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
    list_display = ["name", "type", "abv"]
    list_filter = ["type"]
    search_fields = ["name"]
    prepopulated_fields = {"slug": ("name",)}
    ordering = ["type", "name"]


@admin.register(Recipe)
class RecipeAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "category",
        "difficulty",
        "glass_type",
        "is_featured",
        "is_published",
        "avg_rating",
        "created_at",
    ]
    list_filter = ["is_published", "is_featured", "difficulty", "category", "is_alcoholic"]
    search_fields = ["title", "description"]
    prepopulated_fields = {"slug": ("title",)}
    autocomplete_fields = ["category", "created_by"]
    readonly_fields = ["created_at", "updated_at"]
    inlines = [RecipeIngredientInline, RatingInline, CommentInline]

    fieldsets = [
        (None, {"fields": ["title", "slug", "description", "instructions", "history", "image"]}),
        ("Classification", {"fields": ["category", "difficulty", "glass_type", "is_alcoholic"]}),
        ("Display", {"fields": ["prep_time_minutes", "is_featured", "is_published"]}),
        ("Metadata", {"fields": ["created_by", "created_at", "updated_at"]}),
    ]

    @admin.display(description="Rating")
    def avg_rating(self, obj):
        avg = obj.average_rating
        return f"{avg}★" if avg else "—"


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
    list_display = ["name", "city", "country", "is_featured", "is_published"]
    list_filter = ["is_published", "is_featured", "country"]
    search_fields = ["name", "city", "country"]
    prepopulated_fields = {"slug": ("name",)}
    readonly_fields = ["created_at", "updated_at"]

    fieldsets = [
        (None, {"fields": ["name", "slug", "description", "image"]}),
        ("Location", {"fields": ["address", "city", "country", "latitude", "longitude"]}),
        ("Links", {"fields": ["website"]}),
        ("Display", {"fields": ["is_featured", "is_published"]}),
        ("Metadata", {"fields": ["created_at", "updated_at"]}),
    ]


# Extend the built-in User admin to support autocomplete
admin.site.unregister(User)

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    search_fields = ["username", "email", "first_name", "last_name"]
