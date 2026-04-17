from django.urls import path

from . import views

urlpatterns = [
    path("recipes/", views.RecipeListView.as_view()),
    path("recipes/<slug:slug>/", views.RecipeDetailView.as_view()),
    path("ingredients/", views.IngredientSearchView.as_view()),
    path("categories/", views.CategoryListView.as_view()),
]
