import os

from django.contrib import admin
from django.conf import settings
from django.core.exceptions import PermissionDenied, SuspiciousFileOperation
from django.http import FileResponse, Http404
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.urls import path, reverse
from django.utils.html import format_html
from django.utils.text import get_valid_filename

from .email_notifications import NotificationAttemptResult, send_lead_notification
from .models import Lead, LeadAttachment


NOTIFICATION_RETRY_LIMIT = 5


class LeadAttachmentInline(admin.TabularInline):
    model = LeadAttachment
    fk_name = "lead"
    extra = 0
    can_delete = False
    fields = ("original_name", "size", "created_at", "download_link")
    readonly_fields = fields

    @admin.display(description="Скачать")
    def download_link(self, attachment):
        if not attachment.pk:
            return "—"
        url = reverse("admin:leads_leadattachment_download", args=(attachment.pk,))
        return format_html('<a href="{}">Скачать</a>', url)


@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    inlines = (LeadAttachmentInline,)
    actions = ("retry_failed_notifications",)
    list_display = (
        "id",
        "name",
        "company_name",
        "phone",
        "email",
        "status",
        "notification_status",
        "source_page",
        "source_system",
        "created_at",
    )
    list_filter = (
        "status",
        "notification_status",
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
        "legacy_attachment_state",
        "created_at",
        "notification_status",
        "notification_attempts",
        "notification_last_attempt_at",
        "notification_sent_at",
        "notification_last_error_code",
        "submission_id",
        "submission_fingerprint",
        "updated_at",
    )
    fields = (
        "name", "company_name", "phone", "email", "description",
        "source_page", "source_system", "status", "legacy_attachment_state",
        "notification_status", "notification_attempts",
        "notification_last_attempt_at", "notification_sent_at",
        "notification_last_error_code", "submission_id",
        "submission_fingerprint", "created_at", "updated_at",
    )
    ordering = (
        "-created_at",
    )

    @admin.display(description="Историческое вложение")
    def legacy_attachment_state(self, lead):
        if not lead or not lead.pk or not lead.attachment:
            return "Отсутствует"
        if LeadAttachment.objects.filter(legacy_source=lead).exists():
            return "Проверенная приватная копия показана ниже"
        return "Ожидает переноса; публичная ссылка скрыта"

    def get_urls(self):
        custom_urls = [
            path(
                "attachments/<int:attachment_id>/download/",
                self.admin_site.admin_view(self.download_attachment),
                name="leads_leadattachment_download",
            )
        ]
        return custom_urls + super().get_urls()

    def download_attachment(self, request, attachment_id):
        attachment = get_object_or_404(
            LeadAttachment.objects.select_related("lead"),
            pk=attachment_id,
        )
        if (
            not request.user.is_staff
            or not request.user.has_perm("leads.view_lead")
            or not self.has_view_permission(request, attachment.lead)
        ):
            raise PermissionDenied

        try:
            filename = get_valid_filename(
                os.path.basename(attachment.original_name or "")
            )
        except (SuspiciousFileOperation, TypeError, ValueError):
            filename = ""
        filename = filename or "attachment"
        try:
            document = attachment.file.storage.open(attachment.file.name, "rb")
        except FileNotFoundError as exc:
            raise Http404("Attachment file not found.") from exc
        return FileResponse(
            document,
            as_attachment=True,
            filename=filename,
        )

    @admin.action(
        description="Повторить неудавшиеся уведомления",
        permissions=("change",),
    )
    def retry_failed_notifications(self, request, queryset):
        if not self.has_change_permission(request):
            raise PermissionDenied

        selected_count = queryset.count()
        if settings.LEAD_NOTIFICATION_MODE == "background":
            queued_count = 0
            # Conditional writes make concurrent actions harmless.  The limit
            # applies to successful transitions, rather than merely selected IDs.
            with transaction.atomic():
                candidates = (
                    queryset.filter(
                        notification_status=Lead.NotificationStatus.FAILED,
                    )
                    .order_by("pk")
                    .values_list("pk", flat=True)
                )
                for lead_id in candidates.iterator():
                    if queued_count == NOTIFICATION_RETRY_LIMIT:
                        break
                    queued_count += Lead.objects.filter(
                        pk=lead_id,
                        notification_status=Lead.NotificationStatus.FAILED,
                    ).update(
                        notification_status=Lead.NotificationStatus.PENDING,
                        notification_last_error_code="",
                    )
            self.message_user(
                request,
                f"Уведомления: поставлено в очередь — {queued_count}, "
                f"пропущено — {selected_count - queued_count}.",
            )
            return
        lead_ids = list(
            queryset.filter(notification_status=Lead.NotificationStatus.FAILED)
            .order_by("pk")
            .values_list("pk", flat=True)[:NOTIFICATION_RETRY_LIMIT]
        )
        sent_count = 0
        failed_count = 0
        skipped_count = selected_count - len(lead_ids)

        for lead_id in lead_ids:
            result = send_lead_notification(
                lead_id,
                allowed_statuses=(Lead.NotificationStatus.FAILED,),
            )
            if result.outcome == NotificationAttemptResult.SENT:
                sent_count += 1
            elif result.outcome == NotificationAttemptResult.FAILED:
                failed_count += 1
            else:
                skipped_count += 1

        self.message_user(
            request,
            (
                f"Уведомления: успешно — {sent_count}, "
                f"с ошибкой — {failed_count}, пропущено — {skipped_count}."
            ),
        )
