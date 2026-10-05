import hashlib
import json
import os
import subprocess
import sys
import tempfile
import uuid
from pathlib import Path
from unittest.mock import ANY, Mock, patch

from django.contrib.admin.sites import AdminSite
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser, Permission
from django.core.exceptions import ImproperlyConfigured, PermissionDenied
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core import mail
from django.core.mail import get_connection
from django.db import DatabaseError, connection, transaction
from django.db.migrations.executor import MigrationExecutor
from django.test import (
    RequestFactory,
    SimpleTestCase,
    TransactionTestCase,
    override_settings,
)
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework.validators import UniqueValidator

from apps.leads.admin import LeadAdmin, NOTIFICATION_RETRY_LIMIT
from apps.leads.checks import check_private_attachment_root
from apps.leads.email_notifications import (
    NotificationAttemptResult,
    NotificationErrorCode,
    _send_email,
    schedule_lead_notification,
    send_lead_notification,
)
from apps.leads.models import Lead, LeadAttachment
from apps.leads.serializers import LeadSerializer
from apps.leads.lead_creation import FINGERPRINT_FIELDS, _cleanup_files, create_lead
from config.settings.base import positive_finite_float_from_env, positive_int_from_env


PUBLIC_RESPONSE_FIELDS = {"id"}


class LeadTestMixin:
    endpoint = "/api/leads/"

    def valid_payload(self, **overrides):
        payload = {
            "name": "Тестовый пользователь",
            "company_name": "Тестовая компания",
            "phone": "+7 000 000-00-00",
            "email": "test@example.com",
            "description": "Синтетическое тестовое обращение",
            "source_page": "/test-page",
            "source_system": "ee_site",
        }
        payload.update(overrides)
        return payload

    def create_lead(self, **overrides):
        values = self.valid_payload(**overrides)
        return Lead.objects.create(**values)


@override_settings(LEAD_NOTIFICATION_EMAIL="manager@example.com")
class LeadCreateAPITests(LeadTestMixin, APITestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.temporary_media = tempfile.TemporaryDirectory()
        cls.addClassCleanup(cls.temporary_media.cleanup)
        cls.media_override = override_settings(
            MEDIA_ROOT=cls.temporary_media.name,
            LEAD_PRIVATE_ATTACHMENT_ROOT=Path(cls.temporary_media.name) / "private",
        )
        cls.media_override.enable()
        cls.addClassCleanup(cls.media_override.disable)

    @patch("apps.leads.email_notifications.EmailMessage.send", return_value=1)
    def test_creates_multipart_lead_and_marks_notification_sent(self, send):
        with self.captureOnCommitCallbacks(execute=True) as callbacks:
            response = self.client.post(
                self.endpoint,
                self.valid_payload(),
                format="multipart",
            )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(callbacks), 1)
        self.assertEqual(set(response.data), PUBLIC_RESPONSE_FIELDS)
        lead = Lead.objects.get()
        self.assertEqual(lead.notification_status, Lead.NotificationStatus.SENT)
        self.assertEqual(lead.notification_attempts, 1)
        self.assertIsNotNone(lead.notification_last_attempt_at)
        self.assertIsNotNone(lead.notification_sent_at)
        self.assertEqual(lead.notification_last_error_code, "")
        send.assert_called_once_with(fail_silently=False)

    @patch("apps.leads.email_notifications.EmailMessage.send", return_value=1)
    def test_legacy_file_is_created_as_private_attachment(self, send):
        content = b"synthetic lead attachment\n"
        attachment = SimpleUploadedFile(
            "request.txt",
            content,
            content_type="text/plain",
        )

        with self.captureOnCommitCallbacks(execute=True):
            response = self.client.post(
                self.endpoint,
                self.valid_payload(attachment=attachment),
                format="multipart",
            )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        lead = Lead.objects.get()
        self.assertFalse(lead.attachment)
        self.assertEqual(lead.attachments.count(), 1)
        private_attachment = lead.attachments.get()
        self.assertEqual(private_attachment.original_name, "request.txt")
        self.assertEqual(private_attachment.size, len(content))
        attachment_path = Path(private_attachment.file.path)
        self.assertTrue(
            attachment_path.is_relative_to(
                Path(self.temporary_media.name) / "private"
            )
        )
        self.assertEqual(attachment_path.read_bytes(), content)
        self.assertEqual(lead.notification_status, Lead.NotificationStatus.SENT)

    @patch("apps.leads.email_notifications.EmailMessage.send")
    def test_email_exception_marks_failed_without_failing_api(self, send):
        sensitive_marker = "SECRET-ADDRESS-user@example.invalid"
        send.side_effect = RuntimeError(sensitive_marker)

        with self.assertLogs("apps.leads.email_notifications", level="ERROR") as logs:
            with self.captureOnCommitCallbacks(execute=True):
                response = self.client.post(
                    self.endpoint,
                    self.valid_payload(),
                    format="multipart",
                )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        lead = Lead.objects.get()
        self.assertEqual(lead.notification_status, Lead.NotificationStatus.FAILED)
        self.assertEqual(lead.notification_attempts, 1)
        self.assertIsNone(lead.notification_sent_at)
        self.assertEqual(
            lead.notification_last_error_code,
            NotificationErrorCode.EMAIL_BACKEND_FAILED,
        )
        self.assertTrue(any(f"lead_id={lead.id}" in line for line in logs.output))
        self.assertNotIn(sensitive_marker, "\n".join(logs.output))

    @patch("apps.leads.email_notifications._store_notification_result")
    @patch("apps.leads.email_notifications.EmailMessage.send", return_value=1)
    def test_result_write_failure_does_not_fail_saved_api_response(self, send, store):
        sensitive_marker = "SECRET-SQL-password-value"
        store.side_effect = DatabaseError(sensitive_marker)

        with self.assertLogs("apps.leads.email_notifications", level="ERROR") as logs:
            with self.captureOnCommitCallbacks(execute=True):
                response = self.client.post(
                    self.endpoint,
                    self.valid_payload(),
                    format="multipart",
                )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        lead = Lead.objects.get()
        self.assertEqual(lead.notification_status, Lead.NotificationStatus.SENDING)
        self.assertEqual(lead.notification_attempts, 1)
        self.assertNotIn(sensitive_marker, "\n".join(logs.output))

    @patch("apps.leads.email_notifications.send_lead_notification")
    def test_creation_rollback_does_not_run_notification(self, send):
        with self.captureOnCommitCallbacks(execute=True) as callbacks:
            try:
                with transaction.atomic():
                    lead = self.create_lead(
                        notification_status=Lead.NotificationStatus.PENDING
                    )
                    schedule_lead_notification(lead.id)
                    raise RuntimeError("synthetic rollback")
            except RuntimeError:
                pass

        self.assertEqual(callbacks, [])
        self.assertFalse(Lead.objects.exists())
        send.assert_not_called()

    @patch("apps.leads.email_notifications.EmailMessage.send", return_value=1)
    def test_public_client_cannot_change_notification_fields(self, send):
        attempted_time = "2000-01-01T00:00:00Z"
        payload = self.valid_payload(
            id=999,
            status=Lead.Status.REJECTED,
            notification_status=Lead.NotificationStatus.SENT,
            notification_attempts=999,
            notification_last_attempt_at=attempted_time,
            notification_sent_at=attempted_time,
            notification_last_error_code="client_value",
        )

        with self.captureOnCommitCallbacks(execute=True):
            response = self.client.post(self.endpoint, payload, format="multipart")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(set(response.data), PUBLIC_RESPONSE_FIELDS)
        lead = Lead.objects.get()
        self.assertEqual(lead.notification_status, Lead.NotificationStatus.SENT)
        self.assertNotEqual(lead.id, 999)
        self.assertEqual(lead.status, Lead.Status.NEW)
        self.assertEqual(lead.notification_attempts, 1)
        self.assertNotEqual(lead.notification_last_attempt_at.year, 2000)
        self.assertNotEqual(lead.notification_sent_at.year, 2000)
        self.assertEqual(lead.notification_last_error_code, "")

    @patch("apps.leads.email_notifications.send_lead_notification")
    def test_validation_errors_do_not_schedule_notification(self, send):
        for overrides, expected_field in (
            ({"name": "", "phone": ""}, "name"),
            ({"email": "not-an-email"}, "email"),
        ):
            with self.subTest(expected_field=expected_field):
                response = self.client.post(
                    self.endpoint,
                    self.valid_payload(**overrides),
                    format="multipart",
                )
                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
                self.assertIn(expected_field, response.data)

        self.assertFalse(Lead.objects.exists())
        send.assert_not_called()


class LeadIdempotencyTests(LeadTestMixin, APITestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.temporary_media = tempfile.TemporaryDirectory()
        cls.addClassCleanup(cls.temporary_media.cleanup)
        cls.media_override = override_settings(
            MEDIA_ROOT=cls.temporary_media.name,
            LEAD_PRIVATE_ATTACHMENT_ROOT=Path(cls.temporary_media.name) / "private",
        )
        cls.media_override.enable()
        cls.addClassCleanup(cls.media_override.disable)

    @patch("apps.leads.lead_creation.schedule_lead_notification")
    def test_identical_retry_returns_minimal_confirmation(self, schedule):
        submission_id = uuid.uuid4()
        payload = self.valid_payload(submission_id=str(submission_id))

        first = self.client.post(self.endpoint, payload, format="multipart")
        duplicate = self.client.post(self.endpoint, payload, format="multipart")

        self.assertEqual(first.status_code, status.HTTP_201_CREATED)
        self.assertEqual(duplicate.status_code, status.HTTP_200_OK)
        self.assertEqual(duplicate.data, {"id": first.data["id"], "duplicate": True})
        self.assertEqual(Lead.objects.count(), 1)
        schedule.assert_called_once()

    def test_submission_id_has_no_automatic_unique_validator(self):
        validators = LeadSerializer().fields["submission_id"].validators
        self.assertFalse(
            any(isinstance(validator, UniqueValidator) for validator in validators)
        )

    @patch("apps.leads.lead_creation.schedule_lead_notification")
    def test_identical_file_retry_keeps_one_record_and_file(self, schedule):
        submission_id = str(uuid.uuid4())

        def payload():
            return self.valid_payload(
                submission_id=submission_id,
                attachment=SimpleUploadedFile(
                    "specification.txt",
                    b"same synthetic content",
                    content_type="text/plain",
                ),
            )

        first = self.client.post(self.endpoint, payload(), format="multipart")
        duplicate = self.client.post(self.endpoint, payload(), format="multipart")

        self.assertEqual(first.status_code, status.HTTP_201_CREATED)
        self.assertEqual(duplicate.status_code, status.HTTP_200_OK)
        self.assertEqual(first.data.keys(), {"id"})
        self.assertEqual(duplicate.data, {"id": first.data["id"], "duplicate": True})
        self.assertEqual(Lead.objects.count(), 1)
        self.assertEqual(LeadAttachment.objects.count(), 1)
        files = [path for path in Path(self.temporary_media.name).rglob("*") if path.is_file()]
        self.assertEqual(len(files), 1)
        schedule.assert_called_once()

    @patch("apps.leads.lead_creation.schedule_lead_notification")
    def test_same_key_with_changed_text_returns_conflict(self, schedule):
        submission_id = str(uuid.uuid4())
        first = self.client.post(
            self.endpoint,
            self.valid_payload(submission_id=submission_id),
            format="multipart",
        )
        conflict = self.client.post(
            self.endpoint,
            self.valid_payload(
                submission_id=submission_id,
                description="Изменённое синтетическое описание",
            ),
            format="multipart",
        )

        self.assertEqual(first.status_code, status.HTTP_201_CREATED)
        self.assertEqual(conflict.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(conflict.data["code"], "submission_conflict")
        self.assertNotIn("name", conflict.data)
        self.assertEqual(Lead.objects.count(), 1)
        schedule.assert_called_once()

    @patch("apps.leads.lead_creation.schedule_lead_notification")
    def test_legacy_single_file_fingerprint_remains_compatible(self, schedule):
        submission_id = uuid.uuid4()
        content = b"legacy fingerprint content"
        payload = self.valid_payload(submission_id=str(submission_id))
        canonical = {
            field: payload.get(field, "") or "" for field in FINGERPRINT_FIELDS
        }
        canonical["attachment"] = {
            "name": "legacy.txt",
            "size": len(content),
            "sha256": hashlib.sha256(content).hexdigest(),
        }
        old_fingerprint = hashlib.sha256(
            json.dumps(
                canonical,
                ensure_ascii=False,
                sort_keys=True,
                separators=(",", ":"),
            ).encode("utf-8")
        ).hexdigest()
        historical_lead = self.create_lead(
            submission_id=submission_id,
            submission_fingerprint=old_fingerprint,
            attachment=SimpleUploadedFile("legacy.txt", content),
        )
        historical_name = historical_lead.attachment.name
        historical_path = Path(historical_lead.attachment.path)
        files_before = {
            path.relative_to(self.temporary_media.name)
            for path in Path(self.temporary_media.name).rglob("*")
            if path.is_file()
        }

        duplicate = self.client.post(
            self.endpoint,
            self.valid_payload(
                submission_id=str(submission_id),
                attachment=SimpleUploadedFile("legacy.txt", content),
            ),
            format="multipart",
        )
        conflict = self.client.post(
            self.endpoint,
            self.valid_payload(
                submission_id=str(submission_id),
                attachment=SimpleUploadedFile("legacy.txt", b"changed content"),
            ),
            format="multipart",
        )

        self.assertEqual(duplicate.status_code, status.HTTP_200_OK)
        self.assertEqual(
            duplicate.data,
            {"id": historical_lead.id, "duplicate": True},
        )
        self.assertEqual(conflict.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(conflict.data["code"], "submission_conflict")
        self.assertEqual(Lead.objects.count(), 1)
        self.assertFalse(LeadAttachment.objects.exists())
        historical_lead.refresh_from_db()
        self.assertEqual(historical_lead.attachment.name, historical_name)
        self.assertEqual(historical_lead.submission_fingerprint, old_fingerprint)
        self.assertEqual(historical_path.read_bytes(), content)
        files_after = {
            path.relative_to(self.temporary_media.name)
            for path in Path(self.temporary_media.name).rglob("*")
            if path.is_file()
        }
        self.assertEqual(files_after, files_before)
        schedule.assert_not_called()

    @patch("apps.leads.lead_creation.schedule_lead_notification")
    def test_same_filename_with_changed_content_returns_conflict(self, schedule):
        submission_id = str(uuid.uuid4())

        def payload(content):
            return self.valid_payload(
                submission_id=submission_id,
                attachment=SimpleUploadedFile("same.txt", content),
            )

        first = self.client.post(self.endpoint, payload(b"first"), format="multipart")
        conflict = self.client.post(
            self.endpoint,
            payload(b"different"),
            format="multipart",
        )

        self.assertEqual(first.status_code, status.HTTP_201_CREATED)
        self.assertEqual(conflict.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(Lead.objects.count(), 1)
        schedule.assert_called_once()

    @patch("apps.leads.lead_creation.schedule_lead_notification")
    def test_different_keys_allow_same_phone_and_legacy_requests(self, schedule):
        for submission_id in (str(uuid.uuid4()), str(uuid.uuid4()), None, None):
            payload = self.valid_payload()
            if submission_id:
                payload["submission_id"] = submission_id
            response = self.client.post(self.endpoint, payload, format="multipart")
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        self.assertEqual(Lead.objects.count(), 4)
        self.assertEqual(schedule.call_count, 4)

    def test_invalid_uuid_is_rejected(self):
        response = self.client.post(
            self.endpoint,
            self.valid_payload(submission_id="not-a-uuid"),
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("submission_id", response.data)
        self.assertFalse(Lead.objects.exists())

    @override_settings(
        LEAD_MAX_FILES=10,
        LEAD_MAX_FILE_SIZE=10,
        LEAD_MAX_TOTAL_FILE_SIZE=25,
    )
    @patch("apps.leads.lead_creation.schedule_lead_notification")
    def test_multiple_attachment_limits_and_boundaries(self, schedule):
        def upload(name, size):
            return SimpleUploadedFile(name, b"x" * size)

        accepted_cases = (
            [],
            [upload("one.bin", 10)],
            [upload(f"file-{index}.bin", 1) for index in range(10)],
            [upload("a.bin", 10), upload("b.bin", 10), upload("c.bin", 5)],
        )
        for attachments in accepted_cases:
            with self.subTest(count=len(attachments)):
                response = self.client.post(
                    self.endpoint,
                    self.valid_payload(
                        submission_id=str(uuid.uuid4()),
                        attachments=attachments,
                    ),
                    format="multipart",
                )
                self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        rejected_cases = (
            [upload(f"too-many-{index}.bin", 1) for index in range(11)],
            [upload("too-large.bin", 11)],
            [upload("a.bin", 10), upload("b.bin", 10), upload("c.bin", 6)],
            [upload("empty.bin", 0)],
        )
        for attachments in rejected_cases:
            with self.subTest(rejected_count=len(attachments)):
                response = self.client.post(
                    self.endpoint,
                    self.valid_payload(
                        submission_id=str(uuid.uuid4()),
                        attachments=attachments,
                    ),
                    format="multipart",
                )
                self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @patch("apps.leads.lead_creation.schedule_lead_notification")
    def test_legacy_and_multiple_contract_conflict(self, schedule):
        response = self.client.post(
            self.endpoint,
            self.valid_payload(
                attachment=SimpleUploadedFile("legacy.txt", b"legacy"),
                attachments=[SimpleUploadedFile("new.txt", b"new")],
            ),
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(Lead.objects.exists())
        schedule.assert_not_called()

    @override_settings(LEAD_MAX_FILE_SIZE=10, LEAD_MAX_TOTAL_FILE_SIZE=10)
    @patch("apps.leads.lead_creation.schedule_lead_notification")
    def test_legacy_attachment_uses_same_size_limits(self, schedule):
        accepted = self.client.post(
            self.endpoint,
            self.valid_payload(attachment=SimpleUploadedFile("max.bin", b"x" * 10)),
            format="multipart",
        )
        rejected = self.client.post(
            self.endpoint,
            self.valid_payload(attachment=SimpleUploadedFile("over.bin", b"x" * 11)),
            format="multipart",
        )

        self.assertEqual(accepted.status_code, status.HTTP_201_CREATED)
        self.assertEqual(rejected.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Lead.objects.count(), 1)
        schedule.assert_called_once()

    @patch("apps.leads.lead_creation.schedule_lead_notification")
    def test_identical_multiple_file_retry_creates_one_set(self, schedule):
        submission_id = str(uuid.uuid4())

        def payload():
            return self.valid_payload(
                submission_id=submission_id,
                attachments=[
                    SimpleUploadedFile("a.bin", b"a"),
                    SimpleUploadedFile("b.bin", b"b"),
                ],
            )

        first = self.client.post(self.endpoint, payload(), format="multipart")
        duplicate = self.client.post(self.endpoint, payload(), format="multipart")

        self.assertEqual(first.status_code, status.HTTP_201_CREATED)
        self.assertEqual(duplicate.status_code, status.HTTP_200_OK)
        self.assertEqual(Lead.objects.count(), 1)
        self.assertEqual(LeadAttachment.objects.count(), 2)
        schedule.assert_called_once()

    @patch("apps.leads.lead_creation.schedule_lead_notification")
    def test_database_error_after_multiple_files_cleans_storage(self, schedule):
        schedule.side_effect = DatabaseError("synthetic database failure")

        with self.assertRaises(DatabaseError):
            create_lead(
                self.valid_payload(submission_id=uuid.uuid4()),
                [
                    SimpleUploadedFile("a.bin", b"a"),
                    SimpleUploadedFile("b.bin", b"b"),
                ],
            )

        self.assertFalse(Lead.objects.exists())
        self.assertFalse(LeadAttachment.objects.exists())
        private_root = Path(self.temporary_media.name) / "private"
        self.assertFalse(any(path.is_file() for path in private_root.rglob("*")))

    @patch("apps.leads.lead_creation.schedule_lead_notification")
    def test_legacy_attachment_record_error_rolls_back_and_cleans_file(
        self,
        schedule,
    ):
        with tempfile.TemporaryDirectory() as media_root:
            private_root = Path(media_root) / "private"
            with override_settings(
                MEDIA_ROOT=media_root,
                LEAD_PRIVATE_ATTACHMENT_ROOT=private_root,
            ):
                saved_private_paths = []

                def fail_after_file_write(attachment, *args, **kwargs):
                    stored_path = Path(attachment.file.path)
                    self.assertTrue(stored_path.is_file())
                    self.assertTrue(stored_path.is_relative_to(private_root))
                    saved_private_paths.append(stored_path)
                    raise DatabaseError("synthetic attachment row failure")

                with patch.object(
                    LeadAttachment,
                    "save",
                    autospec=True,
                    side_effect=fail_after_file_write,
                ):
                    with self.assertRaises(DatabaseError):
                        create_lead(
                            self.valid_payload(
                                attachment=SimpleUploadedFile(
                                    "legacy-cleanup.txt",
                                    b"private content",
                                )
                            )
                        )

            self.assertFalse(Lead.objects.exists())
            self.assertFalse(LeadAttachment.objects.exists())
            self.assertEqual(len(saved_private_paths), 1)
            self.assertFalse(saved_private_paths[0].exists())
            self.assertFalse(any(path.is_file() for path in private_root.rglob("*")))
            public_files = {
                path
                for path in Path(media_root).rglob("*")
                if path.is_file() and not path.is_relative_to(private_root)
            }
            self.assertEqual(public_files, set())
        schedule.assert_not_called()

    @patch("apps.leads.lead_creation.schedule_lead_notification")
    def test_storage_error_on_second_file_cleans_first_file(self, schedule):
        from django.db.models.fields.files import FieldFile

        private_root = Path(self.temporary_media.name) / "private"
        files_before = {
            path.relative_to(private_root)
            for path in private_root.rglob("*")
            if path.is_file()
        }
        original_save = FieldFile.save
        calls = 0

        def fail_second(field_file, *args, **kwargs):
            nonlocal calls
            calls += 1
            if calls == 2:
                raise OSError("synthetic storage failure")
            return original_save(field_file, *args, **kwargs)

        with patch.object(FieldFile, "save", new=fail_second):
            with self.assertRaises(OSError):
                create_lead(
                    self.valid_payload(submission_id=uuid.uuid4()),
                    [
                        SimpleUploadedFile("cleanup-a.bin", b"a"),
                        SimpleUploadedFile("cleanup-b.bin", b"b"),
                    ],
                )

        files_after = {
            path.relative_to(private_root)
            for path in private_root.rglob("*")
            if path.is_file()
        }
        self.assertFalse(Lead.objects.exists())
        self.assertEqual(files_after, files_before)

    @patch("apps.leads.lead_creation.LeadAttachment.objects.filter")
    @patch("apps.leads.lead_creation.Lead.objects.filter")
    def test_cleanup_continues_after_legacy_storage_error(
        self,
        lead_filter,
        attachment_filter,
    ):
        sensitive_marker = "/private/client/SECRET-drawing.dwg"
        lead_filter.return_value.exists.return_value = False
        attachment_filter.return_value.exists.return_value = False
        multiple_storage = Mock()
        legacy_storage = Mock()
        legacy_storage.delete.side_effect = OSError(sensitive_marker)

        with self.assertLogs("apps.leads.lead_creation", level="ERROR") as logs:
            _cleanup_files(
                [
                    (multiple_storage, "private-multiple-name", "multiple"),
                    (legacy_storage, "private-legacy-name", "legacy"),
                ]
            )

        legacy_storage.delete.assert_called_once_with("private-legacy-name")
        multiple_storage.delete.assert_called_once_with("private-multiple-name")
        formatted_logs = "\n".join(logs.output)
        self.assertNotIn(sensitive_marker, formatted_logs)
        self.assertNotIn("private-legacy-name", formatted_logs)
        self.assertNotIn("private-multiple-name", formatted_logs)

    @patch("apps.leads.lead_creation.schedule_lead_notification")
    def test_integrity_error_loser_file_is_removed(self, schedule):
        submission_id = uuid.uuid4()
        winner, _ = create_lead(
            self.valid_payload(
                submission_id=submission_id,
                attachment=SimpleUploadedFile("race.txt", b"race content"),
            )
        )
        files_before = {
            path for path in Path(self.temporary_media.name).rglob("*") if path.is_file()
        }

        from apps.leads import lead_creation

        original_duplicate_result = lead_creation._duplicate_result
        calls = 0

        def simulate_race(key, fingerprint):
            nonlocal calls
            calls += 1
            if calls == 1:
                raise Lead.DoesNotExist
            return original_duplicate_result(key, fingerprint)

        with patch(
            "apps.leads.lead_creation._duplicate_result",
            side_effect=simulate_race,
        ):
            duplicate, created = create_lead(
                self.valid_payload(
                    submission_id=submission_id,
                    attachment=SimpleUploadedFile("race.txt", b"race content"),
                )
            )

        files_after = {
            path for path in Path(self.temporary_media.name).rglob("*") if path.is_file()
        }
        self.assertFalse(created)
        self.assertEqual(duplicate.id, winner.id)
        self.assertEqual(files_after, files_before)
        self.assertEqual(Lead.objects.count(), 1)


class NotificationServiceTests(LeadTestMixin, APITestCase):
    @override_settings(LEAD_NOTIFICATION_EMAIL="")
    def test_missing_recipient_marks_failed(self):
        lead = self.create_lead(notification_status=Lead.NotificationStatus.PENDING)

        result = send_lead_notification(lead.id)

        lead.refresh_from_db()
        self.assertEqual(result.outcome, NotificationAttemptResult.FAILED)
        self.assertEqual(lead.notification_status, Lead.NotificationStatus.FAILED)
        self.assertEqual(
            lead.notification_last_error_code,
            NotificationErrorCode.RECIPIENT_NOT_CONFIGURED,
        )

    @override_settings(LEAD_NOTIFICATION_EMAIL="manager@example.com")
    @patch("django.core.files.storage.FileSystemStorage.open")
    def test_attachment_read_error_marks_failed(self, storage_open):
        sensitive_marker = "/private/client/SECRET-document.pdf"
        storage_open.side_effect = OSError(sensitive_marker)
        with tempfile.TemporaryDirectory() as media_root:
            with override_settings(MEDIA_ROOT=media_root):
                lead = self.create_lead(
                    notification_status=Lead.NotificationStatus.PENDING,
                    attachment=SimpleUploadedFile("synthetic.txt", b"content"),
                )

                with self.assertLogs(
                    "apps.leads.email_notifications", level="ERROR"
                ) as logs:
                    result = send_lead_notification(lead.id)

        lead.refresh_from_db()
        self.assertEqual(result.outcome, NotificationAttemptResult.FAILED)
        self.assertEqual(lead.notification_status, Lead.NotificationStatus.FAILED)
        self.assertEqual(
            lead.notification_last_error_code,
            NotificationErrorCode.ATTACHMENT_READ_FAILED,
        )
        self.assertNotIn(sensitive_marker, "\n".join(logs.output))

    @override_settings(LEAD_NOTIFICATION_EMAIL="manager@example.com")
    @patch("apps.leads.email_notifications.EmailMessage")
    def test_message_preparation_error_marks_failed_without_sensitive_log(self, message):
        sensitive_marker = "SECRET-recipient@example.invalid"
        message.side_effect = ValueError(sensitive_marker)
        lead = self.create_lead(notification_status=Lead.NotificationStatus.PENDING)

        with self.assertLogs("apps.leads.email_notifications", level="ERROR") as logs:
            result = send_lead_notification(lead.id)

        lead.refresh_from_db()
        self.assertEqual(result.outcome, NotificationAttemptResult.FAILED)
        self.assertEqual(lead.notification_status, Lead.NotificationStatus.FAILED)
        self.assertEqual(
            lead.notification_last_error_code,
            NotificationErrorCode.MESSAGE_PREPARATION_FAILED,
        )
        self.assertNotIn(sensitive_marker, "\n".join(logs.output))

    @override_settings(LEAD_NOTIFICATION_EMAIL="manager@example.com")
    @patch("apps.leads.email_notifications.EmailMessage.send", return_value=0)
    def test_zero_send_result_marks_failed(self, send):
        lead = self.create_lead(notification_status=Lead.NotificationStatus.PENDING)

        result = send_lead_notification(lead.id)

        lead.refresh_from_db()
        self.assertEqual(result.outcome, NotificationAttemptResult.FAILED)
        self.assertEqual(lead.notification_status, Lead.NotificationStatus.FAILED)
        self.assertEqual(
            lead.notification_last_error_code,
            NotificationErrorCode.EMAIL_BACKEND_SENT_ZERO,
        )

    @override_settings(LEAD_NOTIFICATION_EMAIL="manager@example.com")
    @patch("apps.leads.email_notifications.EmailMessage.send", return_value=1)
    def test_retry_failed_notification_marks_sent_and_updates_metadata(self, send):
        previous_attempt = timezone.now()
        lead = self.create_lead(
            notification_status=Lead.NotificationStatus.FAILED,
            notification_attempts=1,
            notification_last_attempt_at=previous_attempt,
            notification_last_error_code=NotificationErrorCode.EMAIL_BACKEND_FAILED,
        )

        result = send_lead_notification(
            lead.id,
            allowed_statuses=(Lead.NotificationStatus.FAILED,),
        )

        lead.refresh_from_db()
        self.assertEqual(result.outcome, NotificationAttemptResult.SENT)
        self.assertEqual(lead.notification_status, Lead.NotificationStatus.SENT)
        self.assertEqual(lead.notification_attempts, 2)
        self.assertGreaterEqual(lead.notification_last_attempt_at, previous_attempt)
        self.assertIsNotNone(lead.notification_sent_at)
        self.assertEqual(lead.notification_last_error_code, "")

    @patch("apps.leads.email_notifications._send_email")
    def test_atomic_claim_prevents_second_attempt(self, send_email):
        lead = self.create_lead(notification_status=Lead.NotificationStatus.PENDING)
        nested_results = []

        def send_with_nested_attempt(current_lead):
            nested_results.append(send_lead_notification(current_lead.id))
            return True, ""

        send_email.side_effect = send_with_nested_attempt

        result = send_lead_notification(lead.id)

        lead.refresh_from_db()
        self.assertEqual(result.outcome, NotificationAttemptResult.SENT)
        self.assertEqual(nested_results[0].outcome, NotificationAttemptResult.SKIPPED)
        self.assertEqual(lead.notification_attempts, 1)
        send_email.assert_called_once()

    @patch("apps.leads.email_notifications.Lead.objects.get")
    def test_disappearing_lead_after_claim_is_handled(self, get_lead):
        get_lead.side_effect = Lead.DoesNotExist("SECRET-missing-lead-details")
        lead = self.create_lead(notification_status=Lead.NotificationStatus.PENDING)

        with self.assertLogs("apps.leads.email_notifications", level="ERROR") as logs:
            result = send_lead_notification(lead.id)

        lead.refresh_from_db()
        self.assertEqual(result.outcome, NotificationAttemptResult.FAILED)
        self.assertEqual(result.error_code, NotificationErrorCode.LEAD_NOT_FOUND)
        self.assertEqual(lead.notification_status, Lead.NotificationStatus.SENDING)
        self.assertNotIn("SECRET-missing-lead-details", "\n".join(logs.output))


class LeadAdminTests(LeadTestMixin, APITestCase):
    def setUp(self):
        self.lead_admin = LeadAdmin(Lead, AdminSite())
        self.request = RequestFactory().post("/admin/apps/leads/lead/")
        self.request.user = AnonymousUser()

    def test_retry_action_requires_change_permission(self):
        queryset = Lead.objects.none()
        with patch.object(self.lead_admin, "has_change_permission", return_value=False):
            with self.assertRaises(PermissionDenied):
                self.lead_admin.retry_failed_notifications(self.request, queryset)

    def test_notification_fields_are_visible_and_read_only(self):
        self.assertIn("notification_status", self.lead_admin.list_display)
        self.assertIn("notification_status", self.lead_admin.list_filter)
        for field_name in (
            "notification_status",
            "notification_attempts",
            "notification_last_attempt_at",
            "notification_sent_at",
            "notification_last_error_code",
        ):
            self.assertIn(field_name, self.lead_admin.readonly_fields)

    @patch("apps.leads.admin.send_lead_notification")
    def test_retry_action_skips_other_states_and_limits_attempts(self, send):
        for index in range(NOTIFICATION_RETRY_LIMIT + 2):
            self.create_lead(
                name=f"Тестовая заявка {index}",
                notification_status=Lead.NotificationStatus.FAILED,
            )
        for notification_status in (
            Lead.NotificationStatus.SENT,
            Lead.NotificationStatus.UNKNOWN,
            Lead.NotificationStatus.SENDING,
        ):
            self.create_lead(notification_status=notification_status)

        send.return_value = NotificationAttemptResult(NotificationAttemptResult.SENT)
        queryset = Lead.objects.all()

        with patch.object(self.lead_admin, "has_change_permission", return_value=True):
            with patch.object(self.lead_admin, "message_user") as message_user:
                self.lead_admin.retry_failed_notifications(self.request, queryset)

        self.assertEqual(send.call_count, NOTIFICATION_RETRY_LIMIT)
        for call in send.call_args_list:
            self.assertEqual(
                call.kwargs["allowed_statuses"],
                (Lead.NotificationStatus.FAILED,),
            )
        message = message_user.call_args.args[1]
        self.assertIn("успешно — 5", message)
        self.assertIn("с ошибкой — 0", message)
        self.assertIn("пропущено — 5", message)

    @override_settings(LEAD_NOTIFICATION_EMAIL="manager@example.com")
    @patch("apps.leads.email_notifications.EmailMessage")
    def test_retry_action_continues_after_preparation_failure(self, message):
        failed_lead = self.create_lead(
            name="Первая тестовая заявка",
            notification_status=Lead.NotificationStatus.FAILED,
        )
        successful_lead = self.create_lead(
            name="Вторая тестовая заявка",
            notification_status=Lead.NotificationStatus.FAILED,
        )
        successful_message = message.return_value
        successful_message.send.return_value = 1
        message.side_effect = [
            ValueError("SECRET-preparation-details"),
            successful_message,
        ]

        with self.assertLogs("apps.leads.email_notifications", level="ERROR") as logs:
            with patch.object(
                self.lead_admin, "has_change_permission", return_value=True
            ):
                with patch.object(self.lead_admin, "message_user") as message_user:
                    self.lead_admin.retry_failed_notifications(
                        self.request,
                        Lead.objects.filter(
                            pk__in=(failed_lead.pk, successful_lead.pk)
                        ),
                    )

        failed_lead.refresh_from_db()
        successful_lead.refresh_from_db()
        self.assertEqual(failed_lead.notification_status, Lead.NotificationStatus.FAILED)
        self.assertEqual(successful_lead.notification_status, Lead.NotificationStatus.SENT)
        result_message = message_user.call_args.args[1]
        self.assertIn("успешно — 1", result_message)
        self.assertIn("с ошибкой — 1", result_message)
        self.assertNotIn("SECRET-preparation-details", "\n".join(logs.output))


class LeadAttachmentAccessAndEmailTests(LeadTestMixin, APITestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.private_directory = tempfile.TemporaryDirectory()
        cls.addClassCleanup(cls.private_directory.cleanup)
        cls.settings_override = override_settings(
            LEAD_PRIVATE_ATTACHMENT_ROOT=cls.private_directory.name,
            LEAD_NOTIFICATION_EMAIL="manager@example.com",
        )
        cls.settings_override.enable()
        cls.addClassCleanup(cls.settings_override.disable)

    def create_private_attachment(self, content=b"document"):
        lead = self.create_lead()
        attachment = LeadAttachment.objects.create(
            lead=lead,
            file=SimpleUploadedFile("drawing.dwg", content),
            original_name="drawing.dwg",
            size=len(content),
        )
        return lead, attachment

    def test_legacy_public_upload_is_included_in_notification(self):
        with self.captureOnCommitCallbacks(execute=True):
            response = self.client.post(
                self.endpoint,
                self.valid_payload(
                    attachment=SimpleUploadedFile("legacy-spec.txt", b"spec")
                ),
                format="multipart",
            )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data, {"id": Lead.objects.get().id})
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(len(mail.outbox[0].attachments), 1)
        self.assertIn("legacy-spec.txt", mail.outbox[0].body)

    def test_download_requires_staff_and_view_permission(self):
        _, attachment = self.create_private_attachment()
        url = reverse("admin:leads_leadattachment_download", args=(attachment.pk,))

        anonymous = self.client.get(url)
        self.assertEqual(anonymous.status_code, status.HTTP_302_FOUND)

        User = get_user_model()
        staff = User.objects.create_user("staff", password="synthetic", is_staff=True)
        self.client.force_login(staff)
        self.assertEqual(self.client.get(url).status_code, status.HTTP_403_FORBIDDEN)

        staff.user_permissions.add(Permission.objects.get(codename="view_lead"))
        allowed = self.client.get(url)
        self.assertEqual(allowed.status_code, status.HTTP_200_OK)
        self.assertIn("attachment", allowed["Content-Disposition"])
        self.assertIn("drawing.dwg", allowed["Content-Disposition"])

    @patch("django.core.files.storage.FileSystemStorage.open")
    def test_download_checks_object_permission_before_opening_storage(self, storage_open):
        _, attachment = self.create_private_attachment()
        url = reverse("admin:leads_leadattachment_download", args=(attachment.pk,))
        User = get_user_model()
        staff = User.objects.create_user("object-staff", password="synthetic", is_staff=True)
        staff.user_permissions.add(Permission.objects.get(codename="view_lead"))
        self.client.force_login(staff)

        with patch.object(LeadAdmin, "has_view_permission", return_value=False):
            response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        storage_open.assert_not_called()

    @patch("django.core.files.storage.FileSystemStorage.open", side_effect=FileNotFoundError)
    def test_download_returns_not_found_when_storage_file_is_missing(self, storage_open):
        _, attachment = self.create_private_attachment()
        url = reverse("admin:leads_leadattachment_download", args=(attachment.pk,))
        User = get_user_model()
        staff = User.objects.create_user("missing-staff", password="synthetic", is_staff=True)
        staff.user_permissions.add(Permission.objects.get(codename="view_lead"))
        self.client.force_login(staff)

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        storage_open.assert_called_once()

    @override_settings(LEAD_EMAIL_ATTACHMENT_MAX_TOTAL_SIZE=10)
    def test_email_attaches_all_files_at_threshold(self):
        lead, _ = self.create_private_attachment(b"12345")
        LeadAttachment.objects.create(
            lead=lead,
            file=SimpleUploadedFile("specification.zip", b"67890"),
            original_name="specification.zip",
            size=5,
        )

        sent, error_code = _send_email(lead)

        self.assertTrue(sent)
        self.assertEqual(error_code, "")
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(len(mail.outbox[0].attachments), 2)
        self.assertIn("drawing.dwg", mail.outbox[0].body)
        self.assertIn("specification.zip", mail.outbox[0].body)

    @override_settings(LEAD_EMAIL_ATTACHMENT_MAX_TOTAL_SIZE=10)
    def test_email_attaches_no_files_above_threshold(self):
        lead, _ = self.create_private_attachment(b"12345")
        LeadAttachment.objects.create(
            lead=lead,
            file=SimpleUploadedFile("specification.zip", b"678901"),
            original_name="specification.zip",
            size=6,
        )

        sent, error_code = _send_email(lead)

        self.assertTrue(sent)
        self.assertEqual(error_code, "")
        self.assertEqual(len(mail.outbox[0].attachments), 0)
        self.assertIn("drawing.dwg", mail.outbox[0].body)
        self.assertIn("specification.zip", mail.outbox[0].body)
        self.assertIn("доступны сотрудникам в админке", mail.outbox[0].body)


class NotificationMigrationTests(TransactionTestCase):
    migrate_from = [("leads", "0001_initial")]
    migrate_to = [("leads", "0002_lead_notification_attempts_and_more")]

    def setUp(self):
        super().setUp()
        self.email_send_patcher = patch(
            "apps.leads.email_notifications.EmailMessage.send"
        )
        self.email_send = self.email_send_patcher.start()
        self.addCleanup(self.email_send_patcher.stop)
        self.addCleanup(self.restore_current_schema)

        executor = MigrationExecutor(connection)
        executor.migrate(self.migrate_from)
        old_apps = executor.loader.project_state(self.migrate_from).apps
        OldLead = old_apps.get_model("leads", "Lead")
        self.old_lead_id = OldLead.objects.create(
            name="Старая тестовая заявка",
            phone="+7 000 000-00-00",
        ).pk

        executor = MigrationExecutor(connection)
        executor.migrate(self.migrate_to)
        migrated_apps = executor.loader.project_state(self.migrate_to).apps
        self.MigratedLead = migrated_apps.get_model("leads", "Lead")

    def restore_current_schema(self):
        executor = MigrationExecutor(connection)
        executor.migrate(executor.loader.graph.leaf_nodes())

    def test_existing_lead_becomes_unknown_without_sending(self):
        lead = self.MigratedLead.objects.get(pk=self.old_lead_id)

        self.assertEqual(lead.notification_status, Lead.NotificationStatus.UNKNOWN)
        self.assertEqual(lead.notification_attempts, 0)
        self.assertIsNone(lead.notification_last_attempt_at)
        self.assertIsNone(lead.notification_sent_at)
        self.assertEqual(lead.notification_last_error_code, "")
        self.email_send.assert_not_called()


class SMTPTimeoutTests(APITestCase):
    @override_settings(
        EMAIL_BACKEND="django.core.mail.backends.smtp.EmailBackend",
        EMAIL_HOST="smtp.invalid",
        EMAIL_PORT=2525,
        EMAIL_TIMEOUT=10.0,
        EMAIL_USE_TLS=False,
        EMAIL_USE_SSL=False,
    )
    @patch("django.core.mail.backends.smtp.smtplib.SMTP")
    def test_timeout_is_passed_to_smtp_backend(self, smtp):
        connection = get_connection()
        connection.open()
        smtp.assert_called_once_with(
            "smtp.invalid",
            2525,
            local_hostname=ANY,
            timeout=10.0,
        )


class EmailTimeoutConfigurationTests(SimpleTestCase):
    def test_uses_default_when_variable_is_absent(self):
        with patch.dict(os.environ, {}, clear=True):
            self.assertEqual(
                positive_finite_float_from_env("TEST_EMAIL_TIMEOUT", 10),
                10.0,
            )

    def test_rejects_non_positive_non_finite_and_non_numeric_values(self):
        for invalid_value in ("0", "-1", "nan", "inf", "not-a-number"):
            with self.subTest(invalid_value=invalid_value):
                with patch.dict(os.environ, {"TEST_EMAIL_TIMEOUT": invalid_value}):
                    with self.assertRaisesMessage(
                        ImproperlyConfigured,
                        "TEST_EMAIL_TIMEOUT must be a positive finite number of seconds.",
                    ):
                        positive_finite_float_from_env("TEST_EMAIL_TIMEOUT", 10)


class AttachmentSettingsTests(SimpleTestCase):
    def test_positive_integer_limits_accept_positive_values(self):
        with patch.dict(os.environ, {"TEST_ATTACHMENT_LIMIT": "25"}):
            self.assertEqual(
                positive_int_from_env("TEST_ATTACHMENT_LIMIT", 10),
                25,
            )

    def test_positive_integer_limits_reject_invalid_values(self):
        for invalid_value in ("0", "-1", "1.5", "not-a-number"):
            with self.subTest(invalid_value=invalid_value):
                with patch.dict(
                    os.environ,
                    {"TEST_ATTACHMENT_LIMIT": invalid_value},
                ):
                    with self.assertRaisesMessage(
                        ImproperlyConfigured,
                        "TEST_ATTACHMENT_LIMIT must be a positive integer.",
                    ):
                        positive_int_from_env("TEST_ATTACHMENT_LIMIT", 10)

    def test_private_root_must_be_outside_normalized_media_root(self):
        with override_settings(
            MEDIA_ROOT="/tmp/ee-media",
            LEAD_PRIVATE_ATTACHMENT_ROOT="/tmp/ee-media/../ee-media/private",
        ):
            errors = check_private_attachment_root(None)

        self.assertEqual([error.id for error in errors], ["leads.E001"])

    def test_private_root_accepts_sibling_directory(self):
        with override_settings(
            MEDIA_ROOT="/tmp/ee-media",
            LEAD_PRIVATE_ATTACHMENT_ROOT="/tmp/ee-private",
        ):
            self.assertEqual(check_private_attachment_root(None), [])


class SettingsIsolationTests(SimpleTestCase):
    def run_settings_import(self, settings_module, fake_dotenv_directory, marker):
        environment = {
            "PATH": os.environ.get("PATH", ""),
            "PYTHONPATH": os.pathsep.join(
                (str(fake_dotenv_directory), str(Path(__file__).parents[2]))
            ),
            "DJANGO_SETTINGS_MODULE": settings_module,
        }
        if settings_module.endswith(".test"):
            environment["_EE_SKIP_DOTENV"] = "preexisting-test-value"
        code = (
            "import importlib, os; "
            "settings = importlib.import_module(os.environ['DJANGO_SETTINGS_MODULE']); "
            "assert settings.DATABASES['default']['ENGINE'] == "
            "'django.db.backends.sqlite3' if "
            "os.environ['DJANGO_SETTINGS_MODULE'].endswith('.test') else True; "
            "assert settings.EMAIL_BACKEND == "
            "'django.core.mail.backends.locmem.EmailBackend' if "
            "os.environ['DJANGO_SETTINGS_MODULE'].endswith('.test') else True; "
            "assert os.environ.get('_EE_SKIP_DOTENV') == "
            "'preexisting-test-value' if "
            "os.environ['DJANGO_SETTINGS_MODULE'].endswith('.test') else True"
        )
        subprocess.run(
            [sys.executable, "-c", code],
            check=True,
            env=environment,
            capture_output=True,
            text=True,
        )
        return marker.exists()

    def test_only_test_settings_skip_dotenv_loader(self):
        with tempfile.TemporaryDirectory() as temporary_directory:
            directory = Path(temporary_directory)
            marker = directory / "dotenv-called"
            (directory / "dotenv.py").write_text(
                "from pathlib import Path\n"
                f"def load_dotenv(*args, **kwargs):\n"
                f"    Path({str(marker)!r}).touch()\n",
                encoding="utf-8",
            )

            self.assertFalse(
                self.run_settings_import("config.settings.test", directory, marker)
            )
            self.assertNotIn("_EE_SKIP_DOTENV", os.environ)

            for settings_module in (
                "config.settings.local",
                "config.settings.prod",
            ):
                with self.subTest(settings_module=settings_module):
                    marker.unlink(missing_ok=True)
                    self.assertTrue(
                        self.run_settings_import(settings_module, directory, marker)
                    )
