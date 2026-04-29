from django.contrib import admin

from .models import Lead


@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "name",
        "company",
        "phone",
        "email",
        "status",
        "created_at",
    )

    list_filter = (
        "status",
        "created_at",
    )

    search_fields = (
        "name",
        "company",
        "phone",
        "email",
    )

    readonly_fields = (
        "created_at",
    )