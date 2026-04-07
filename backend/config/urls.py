from django.contrib import admin
from django.urls import path

admin.site.site_header = "The Distillist"
admin.site.site_title = "Distillist Admin"
admin.site.index_title = "Dashboard"

urlpatterns = [
    path("admin/", admin.site.urls),
]
