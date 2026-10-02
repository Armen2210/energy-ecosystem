import hashlib
import json
import logging

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction

from .email_notifications import schedule_lead_notification
from .models import Lead, LeadAttachment


logger = logging.getLogger(__name__)


FINGERPRINT_FIELDS = (
    "name",
    "company_name",
    "phone",
    "email",
    "description",
    "source_page",
    "source_system",
)


class SubmissionConflict(Exception):
    pass


def _attachment_digest(attachment):
    if not attachment:
        return None

    digest = hashlib.sha256()
    original_position = attachment.tell()
    try:
        attachment.seek(0)
        for chunk in attachment.chunks():
            digest.update(chunk)
    finally:
        attachment.seek(original_position)

    return {
        "name": attachment.name,
        "size": attachment.size,
        "sha256": digest.hexdigest(),
    }


def _validate_attachments(legacy_attachment, attachments):
    if legacy_attachment and attachments:
        raise ValidationError(
            {"attachments": "Используйте attachment или attachments, но не оба поля."}
        )
    files = [legacy_attachment] if legacy_attachment else list(attachments)
    if len(files) > settings.LEAD_MAX_FILES:
        raise ValidationError({"attachments": "Превышено допустимое количество файлов."})

    total_size = 0
    for attachment in files:
        if attachment.size <= 0:
            raise ValidationError({"attachments": "Пустые файлы не допускаются."})
        if attachment.size > settings.LEAD_MAX_FILE_SIZE:
            raise ValidationError({"attachments": "Превышен размер одного файла."})
        total_size += attachment.size
    if total_size > settings.LEAD_MAX_TOTAL_FILE_SIZE:
        raise ValidationError({"attachments": "Превышен суммарный размер файлов."})
    return files


def submission_fingerprint(validated_data, attachments=()):
    canonical = {
        field: validated_data.get(field, "") or "" for field in FINGERPRINT_FIELDS
    }
    legacy_attachment = validated_data.get("attachment")
    if attachments:
        canonical["attachments"] = [_attachment_digest(item) for item in attachments]
        canonical["attachment_count"] = len(attachments)
    else:
        # Keep the original single-file fingerprint format for existing keys.
        canonical["attachment"] = _attachment_digest(legacy_attachment)
    encoded = json.dumps(
        canonical,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    ).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def _duplicate_result(submission_id, fingerprint):
    existing = Lead.objects.only("id", "submission_fingerprint").get(
        submission_id=submission_id
    )
    if existing.submission_fingerprint != fingerprint:
        raise SubmissionConflict
    return existing


def _cleanup_files(stored_files):
    for storage, stored_name, field_type in reversed(stored_files):
        try:
            is_referenced = (
                Lead.objects.filter(attachment=stored_name).exists()
                if field_type == "legacy"
                else LeadAttachment.objects.filter(file=stored_name).exists()
            )
            if not is_referenced:
                storage.delete(stored_name)
        except Exception as exc:
            logger.error(
                "Lead attachment cleanup failed code=storage_cleanup_failed exception_type=%s",
                type(exc).__name__,
            )


def create_lead(validated_data, attachments=()):
    attachments = list(attachments)
    _validate_attachments(validated_data.get("attachment"), attachments)
    submission_id = validated_data.get("submission_id")
    fingerprint = (
        submission_fingerprint(validated_data, attachments) if submission_id else ""
    )

    if submission_id:
        try:
            return _duplicate_result(submission_id, fingerprint), False
        except Lead.DoesNotExist:
            pass

    lead = Lead(
        **validated_data,
        submission_fingerprint=fingerprint,
        notification_status=Lead.NotificationStatus.PENDING,
    )
    stored_files = []
    legacy_was_uncommitted = bool(
        lead.attachment and not lead.attachment._committed
    )

    def track_saved_legacy_attachment():
        if (
            legacy_was_uncommitted
            and lead.attachment
            and lead.attachment._committed
            and lead.attachment.name
            and not any(
                name == lead.attachment.name and field_type == "legacy"
                for _, name, field_type in stored_files
            )
        ):
            stored_files.append(
                (lead.attachment.storage, lead.attachment.name, "legacy")
            )

    try:
        with transaction.atomic():
            lead.save()
            track_saved_legacy_attachment()
            for uploaded_file in attachments:
                attachment = LeadAttachment(
                    lead=lead,
                    original_name=uploaded_file.name,
                    size=uploaded_file.size,
                )
                attachment.file.save(uploaded_file.name, uploaded_file, save=False)
                stored_files.append(
                    (attachment.file.storage, attachment.file.name, "multiple")
                )
                attachment.save()
            schedule_lead_notification(lead.id)
    except IntegrityError:
        track_saved_legacy_attachment()
        _cleanup_files(stored_files)
        if not submission_id:
            raise
        return _duplicate_result(submission_id, fingerprint), False
    except Exception:
        track_saved_legacy_attachment()
        _cleanup_files(stored_files)
        raise

    return lead, True
