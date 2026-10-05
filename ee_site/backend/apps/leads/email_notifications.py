import logging
from dataclasses import dataclass

from django.conf import settings
from django.core.mail import EmailMessage
from django.db import DatabaseError, transaction
from django.db.models import F
from django.utils import timezone

from .models import Lead


logger = logging.getLogger(__name__)


class NotificationErrorCode:
    RECIPIENT_NOT_CONFIGURED = "recipient_not_configured"
    RECIPIENT_LIST_EMPTY = "recipient_list_empty"
    ATTACHMENT_READ_FAILED = "attachment_read_failed"
    EMAIL_BACKEND_FAILED = "email_backend_failed"
    EMAIL_BACKEND_SENT_ZERO = "email_backend_sent_zero"
    LEAD_NOT_FOUND = "lead_not_found"
    MESSAGE_PREPARATION_FAILED = "message_preparation_failed"
    POST_CLAIM_FAILED = "post_claim_failed"
    STATE_CLAIM_FAILED = "state_claim_failed"
    STATE_READ_FAILED = "state_read_failed"
    STATE_RESULT_FAILED = "state_result_failed"


@dataclass(frozen=True)
class NotificationAttemptResult:
    outcome: str
    error_code: str = ""

    SENT = "sent"
    FAILED = "failed"
    SKIPPED = "skipped"


def _recipient_list():
    configured_recipients = getattr(settings, "LEAD_NOTIFICATION_EMAIL", "")
    if not configured_recipients:
        return [], NotificationErrorCode.RECIPIENT_NOT_CONFIGURED

    recipients = [
        email.strip()
        for email in configured_recipients.split(",")
        if email.strip()
    ]
    if not recipients:
        return [], NotificationErrorCode.RECIPIENT_LIST_EMPTY

    return recipients, ""


def _send_email(lead):
    try:
        recipients, error_code = _recipient_list()
        if error_code:
            return False, error_code

        private_documents = list(lead.attachments.all())
        has_verified_legacy_copy = any(
            item.legacy_source_id == lead.id for item in private_documents
        )
        documents = []
        if lead.attachment and not has_verified_legacy_copy:
            documents.append(
                (
                    lead.attachment.name.rsplit("/", 1)[-1],
                    lead.attachment.size,
                    lead.attachment.storage,
                    lead.attachment.name,
                )
            )
        documents.extend(
            (item.original_name, item.size, item.file.storage, item.file.name)
            for item in private_documents
        )
        document_lines = "\n".join(
            f"- {name} ({size} байт)" for name, size, _, _ in documents
        ) or "Документы не приложены"
        attach_to_email = (
            sum(size for _, size, _, _ in documents)
            <= settings.LEAD_EMAIL_ATTACHMENT_MAX_TOTAL_SIZE
        )
        if not documents:
            attachment_note = "Документы отсутствуют."
        elif attach_to_email:
            attachment_note = "Документы приложены к письму."
        else:
            attachment_note = (
                "Документы не приложены к письму из-за суммарного размера; "
                f"они доступны сотрудникам в админке по ID заявки {lead.id}."
            )

        message = EmailMessage(
            subject=f"Новая заявка с сайта Энергоэффект: {lead.name}",
            body=(
                "На сайте ООО «Энергоэффект» отправлена новая заявка.\n\n"
                f"ID заявки: {lead.id}\n"
                f"Имя: {lead.name}\n"
                f"Компания: {lead.company_name or 'Не указана'}\n"
                f"Телефон: {lead.phone}\n"
                f"Email: {lead.email or 'Не указан'}\n"
                f"Страница-источник: {lead.source_page or 'Не указана'}\n"
                f"Система-источник: {lead.source_system or 'Не указана'}\n"
                f"Статус: {lead.get_status_display()}\n\n"
                "Описание заявки:\n"
                f"{lead.description or 'Не указано'}\n\n"
                f"Документы:\n{document_lines}\n{attachment_note}"
            ),
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=recipients,
            reply_to=[lead.email] if lead.email else None,
        )
    except Exception as exc:
        _log_notification_error(
            lead.id,
            stage="prepare_message",
            error_code=NotificationErrorCode.MESSAGE_PREPARATION_FAILED,
            exc=exc,
        )
        return False, NotificationErrorCode.MESSAGE_PREPARATION_FAILED

    if attach_to_email:
        try:
            for name, _, storage, stored_name in documents:
                with storage.open(stored_name, "rb") as document:
                    message.attach(name, document.read())
        except Exception as exc:
            _log_notification_error(
                lead.id,
                stage="attach_file",
                error_code=NotificationErrorCode.ATTACHMENT_READ_FAILED,
                exc=exc,
            )
            return False, NotificationErrorCode.ATTACHMENT_READ_FAILED

    try:
        sent_count = message.send(fail_silently=False)
    except Exception as exc:
        _log_notification_error(
            lead.id,
            stage="send_email",
            error_code=NotificationErrorCode.EMAIL_BACKEND_FAILED,
            exc=exc,
        )
        return False, NotificationErrorCode.EMAIL_BACKEND_FAILED

    if sent_count < 1:
        logger.error(
            "Lead notification email backend sent no messages for lead_id=%s",
            lead.id,
        )
        return False, NotificationErrorCode.EMAIL_BACKEND_SENT_ZERO

    return True, ""


def _store_notification_result(lead_id, *, sent, error_code):
    values = {
        "notification_status": (
            Lead.NotificationStatus.SENT if sent else Lead.NotificationStatus.FAILED
        ),
        "notification_sent_at": timezone.now() if sent else None,
        "notification_last_error_code": "" if sent else error_code,
    }
    return Lead.objects.filter(
        pk=lead_id,
        notification_status=Lead.NotificationStatus.SENDING,
    ).update(**values)


def _log_notification_error(lead_id, *, stage, error_code, exc=None):
    exception_type = type(exc).__name__ if exc is not None else "none"
    logger.error(
        "Lead notification error lead_id=%s stage=%s code=%s exception_type=%s",
        lead_id,
        stage,
        error_code,
        exception_type,
    )


def _store_failed_before_send(lead_id, error_code):
    try:
        stored = _store_notification_result(
            lead_id,
            sent=False,
            error_code=error_code,
        )
    except Exception as exc:
        _log_notification_error(
            lead_id,
            stage="store_pre_send_failure",
            error_code=NotificationErrorCode.STATE_RESULT_FAILED,
            exc=exc,
        )
        return False

    if stored != 1:
        _log_notification_error(
            lead_id,
            stage="store_pre_send_failure",
            error_code=NotificationErrorCode.STATE_RESULT_FAILED,
        )
        return False
    return True


def send_lead_notification(lead_id, *, allowed_statuses=None):
    """Claim and perform one notification attempt without holding a DB lock."""
    if allowed_statuses is None:
        allowed_statuses = (Lead.NotificationStatus.PENDING,)

    attempt_started_at = timezone.now()
    try:
        claimed = Lead.objects.filter(
            pk=lead_id,
            notification_status__in=allowed_statuses,
        ).update(
            notification_status=Lead.NotificationStatus.SENDING,
            notification_attempts=F("notification_attempts") + 1,
            notification_last_attempt_at=attempt_started_at,
            notification_last_error_code="",
        )
    except DatabaseError as exc:
        _log_notification_error(
            lead_id,
            stage="claim_state",
            error_code=NotificationErrorCode.STATE_CLAIM_FAILED,
            exc=exc,
        )
        return NotificationAttemptResult(
            NotificationAttemptResult.FAILED,
            NotificationErrorCode.STATE_CLAIM_FAILED,
        )

    if claimed != 1:
        return NotificationAttemptResult(NotificationAttemptResult.SKIPPED)

    try:
        lead = Lead.objects.get(pk=lead_id)
    except Lead.DoesNotExist as exc:
        _log_notification_error(
            lead_id,
            stage="read_lead",
            error_code=NotificationErrorCode.LEAD_NOT_FOUND,
            exc=exc,
        )
        return NotificationAttemptResult(
            NotificationAttemptResult.FAILED,
            NotificationErrorCode.LEAD_NOT_FOUND,
        )
    except Exception as exc:
        _log_notification_error(
            lead_id,
            stage="read_lead",
            error_code=NotificationErrorCode.STATE_READ_FAILED,
            exc=exc,
        )
        _store_failed_before_send(lead_id, NotificationErrorCode.STATE_READ_FAILED)
        return NotificationAttemptResult(
            NotificationAttemptResult.FAILED,
            NotificationErrorCode.STATE_READ_FAILED,
        )
    try:
        sent, error_code = _send_email(lead)
    except Exception as exc:
        _log_notification_error(
            lead_id,
            stage="post_claim",
            error_code=NotificationErrorCode.POST_CLAIM_FAILED,
            exc=exc,
        )
        return NotificationAttemptResult(
            NotificationAttemptResult.FAILED,
            NotificationErrorCode.POST_CLAIM_FAILED,
        )

    try:
        result_stored = _store_notification_result(
            lead_id,
            sent=sent,
            error_code=error_code,
        )
    except Exception as exc:
        _log_notification_error(
            lead_id,
            stage="store_result",
            error_code=NotificationErrorCode.STATE_RESULT_FAILED,
            exc=exc,
        )
        return NotificationAttemptResult(
            NotificationAttemptResult.FAILED,
            NotificationErrorCode.STATE_RESULT_FAILED,
        )

    if result_stored != 1:
        logger.error(
            "Lead notification result was not stored for lead_id=%s code=%s",
            lead_id,
            NotificationErrorCode.STATE_RESULT_FAILED,
        )
        return NotificationAttemptResult(
            NotificationAttemptResult.FAILED,
            NotificationErrorCode.STATE_RESULT_FAILED,
        )

    if sent:
        logger.info("Lead notification email sent for lead_id=%s", lead_id)
        return NotificationAttemptResult(NotificationAttemptResult.SENT)

    return NotificationAttemptResult(NotificationAttemptResult.FAILED, error_code)


def schedule_lead_notification(lead_id):
    transaction.on_commit(
        lambda: send_lead_notification(lead_id),
        robust=True,
    )
