from django.contrib import admin
from django.http import JsonResponse
from django.urls import path

admin.site.site_header = "The Distillist"
admin.site.site_title = "Distillist Admin"
admin.site.index_title = "Dashboard"


def health(request):
    return JsonResponse({"status": "ok"})


urlpatterns = [
    path("health/", health),
    path("admin/", admin.site.urls),
]
