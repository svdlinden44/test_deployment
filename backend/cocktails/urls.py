from django.urls import path

from . import views

urlpatterns = [
    path("recipes/", views.RecipeListView.as_view()),
    path("recipes/<slug:slug>/", views.RecipeDetailView.as_view()),
    path("ingredients/", views.IngredientSearchView.as_view()),
    path("categories/", views.CategoryListView.as_view()),
    path("me/favorites/", views.MyFavoritesListView.as_view()),
    path("me/favorites/<slug:slug>/", views.FavoriteDetailView.as_view()),
    path("me/wishlist/", views.MyWishlistListView.as_view()),
    path("me/wishlist/<slug:slug>/", views.WishlistDetailView.as_view()),
    path("me/cabinet/", views.MyCabinetIngredientListView.as_view()),
    path("me/cabinet/<slug:slug>/", views.CabinetIngredientDetailView.as_view()),
    path("me/recipes/preview-image/", views.RecipeImagePreviewView.as_view()),
    path("me/recipes/", views.MemberRecipeListCreateView.as_view()),
    path("me/ratings/<slug:slug>/", views.RecipeRatingView.as_view()),
]
