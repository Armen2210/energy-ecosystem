from django.contrib import admin

from apps.companies.models import Company


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
        "inn",
        "phone",
        "email",
        "created_at",
    )
    search_fields = (
        "name",
        "inn",
        "phone",
        "email",
    )
    readonly_fields = (
        "created_at",
        "updated_at",
    )
    ordering = (
        "name",
    )