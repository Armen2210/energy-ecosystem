from django.contrib import admin

from .models import Lead


@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
        "company_name",
        "phone",
        "email",
        "status",
        "source_page",
        "source_system",
        "created_at",
    )
    list_filter = (
        "status",
        "source_system",
        "created_at",
    )
    search_fields = (
        "name",
        "company_name",
        "phone",
        "email",
        "description",
    )
    readonly_fields = (
        "created_at",
        "updated_at",
    )
    ordering = (
        "-created_at",
    )