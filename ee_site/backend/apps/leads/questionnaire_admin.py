import json
from django.contrib import admin
from django.core.exceptions import PermissionDenied
from django.http import FileResponse, Http404
from django.shortcuts import get_object_or_404
from django.urls import path, reverse
from django.utils.html import format_html
from .models import LeadQuestionnaire, QuestionnaireJob


class QuestionnaireInline(admin.TabularInline):
    model = LeadQuestionnaire
    extra = 0
    can_delete = False
    fields = readonly_fields = (
        "product",
        "schema_version",
        "size",
        "sha256",
        "download",
        "answer_snapshot",
    )

    def has_add_permission(self, request, obj=None):
        return False

    def has_view_permission(self, request, obj=None):
        return request.user.has_perm("leads.view_lead")

    def has_change_permission(self, request, obj=None):
        return False

    @admin.display(description="Сохранённые ответы")
    def answer_snapshot(self, obj):
        return format_html(
            '<details><summary>Неизменяемый снимок</summary><pre style="max-height:24em;overflow:auto;white-space:pre-wrap">{}</pre></details>',
            json.dumps(obj.answers, ensure_ascii=False, indent=2),
        )

    def download(self, obj):
        if not obj.file:
            return "Ожидает формирования"
        return format_html(
            '<a href="{}">PDF</a>',
            reverse("admin:leads_questionnaire_download", args=(obj.pk,)),
        )


@admin.register(QuestionnaireJob)
class QuestionnaireJobAdmin(admin.ModelAdmin):
    list_display = (
        "lead_id",
        "status",
        "attempts",
        "error_code",
        "lease_until",
        "next_run",
    )
    list_filter = ("status",)
    readonly_fields = (
        "lead",
        "status",
        "attempts",
        "error_code",
        "token",
        "lease_until",
        "next_run",
        "updated_at",
    )
    actions = ("retry_safe",)

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False

    @admin.action(
        description="Повторить после устранения ошибки (не SMTP с неопределённым результатом)",
        permissions=("change",),
    )
    def retry_safe(self, request, queryset):
        count = queryset.filter(status__in=("intervention", "retry")).update(
            status="pending", attempts=0, next_run=None, error_code=""
        )
        self.message_user(
            request,
            f"Поставлено в очередь: {count}. Неопределённые SMTP требуют отдельного разбора.",
        )


def download_questionnaire(modeladmin, request, pk):
    q = get_object_or_404(LeadQuestionnaire.objects.select_related("lead"), pk=pk)
    if (
        not request.user.is_staff
        or not request.user.has_perm("leads.view_lead")
        or not modeladmin.has_view_permission(request, q.lead)
    ):
        raise PermissionDenied
    if not q.file:
        raise Http404
    try:
        f = q.file.open("rb")
    except OSError:
        raise Http404
    response = FileResponse(
        f, as_attachment=True, filename=f"ee-{q.product}-lead-{q.lead_id}.pdf"
    )
    response["Cache-Control"] = "private, no-store"
    response["X-Content-Type-Options"] = "nosniff"
    return response
