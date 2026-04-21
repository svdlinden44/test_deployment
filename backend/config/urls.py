from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path

admin.site.site_header = "The Distillist"
admin.site.site_title = "Distillist Admin"
admin.site.index_title = "Dashboard"


def health(request):
    return JsonResponse({"status": "ok"})


urlpatterns = [
    path("health/", health),
    path("admin/", admin.site.urls),
    path("api/", include("accounts.urls")),
    path("api/", include("cocktails.urls")),
]

if settings.DEBUG:
    _media_root = getattr(settings, "MEDIA_ROOT", None)
    if _media_root:
        urlpatterns += static(settings.MEDIA_URL, document_root=_media_root)
