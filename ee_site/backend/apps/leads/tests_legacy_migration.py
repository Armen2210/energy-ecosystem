import builtins
import io
import tempfile
import uuid
from contextlib import contextmanager
from pathlib import Path
from unittest.mock import MagicMock, patch

from django.contrib.admin.sites import AdminSite
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import CommandError, call_command
from django.db import DatabaseError
from django.db.models.query import QuerySet
from django.test import RequestFactory, TestCase, override_settings

from apps.leads.admin import LeadAdmin
from apps.leads.email_notifications import _send_email
from apps.leads.lead_creation import submission_fingerprint
from apps.leads.management.commands import migrate_legacy_lead_attachments
from apps.leads.models import Lead, LeadAttachment


@contextmanager
def unlocked_migration(_apply):
    """Isolate migration behavior tests from platform-specific process locks."""
    yield


class LegacyAttachmentMigrationTests(TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.settings_override = override_settings(
            MEDIA_ROOT=Path(self.temporary.name) / "public",
            LEAD_PRIVATE_ATTACHMENT_ROOT=Path(self.temporary.name) / "private",
            LEAD_NOTIFICATION_EMAIL="manager@example.invalid",
        )
        self.settings_override.enable()
        self.addCleanup(self.settings_override.disable)
        self.lock_patcher = patch.object(
            migrate_legacy_lead_attachments,
            "migration_lock",
            unlocked_migration,
        )
        self.lock_patcher.start()
        self.addCleanup(self.lock_patcher.stop)

    def lead(self, content=b"synthetic historical document", **values):
        defaults = {
            "name": "Synthetic",
            "phone": "+0",
            "submission_id": uuid.uuid4(),
            "submission_fingerprint": "a" * 64,
            "notification_status": Lead.NotificationStatus.SENT,
            "notification_attempts": 3,
            "attachment": SimpleUploadedFile("history.txt", content),
        }
        defaults.update(values)
        return Lead.objects.create(**defaults)

    def run_command(self, *args):
        stdout, stderr = io.StringIO(), io.StringIO()
        call_command("migrate_legacy_lead_attachments", *args, stdout=stdout, stderr=stderr)
        return stdout.getvalue(), stderr.getvalue()

    def test_dry_run_makes_no_changes(self):
        lead = self.lead()
        public_name = lead.attachment.name
        output, _ = self.run_command()
        self.assertIn("DRY-RUN", output)
        self.assertIn("checked=1 migrated=0 verified=0 skipped=1 problems=0", output)
        self.assertFalse(LeadAttachment.objects.exists())
        self.assertEqual(list((Path(self.temporary.name) / "private").rglob("*")), [])
        self.assertEqual(Lead.objects.get(pk=lead.pk).attachment.name, public_name)

    def test_missing_fcntl_allows_dry_run_but_rejects_sqlite_apply(self):
        self.lead()
        original_import = builtins.__import__

        def without_fcntl(name, *args, **kwargs):
            if name == "fcntl":
                raise ImportError("synthetic Windows platform")
            return original_import(name, *args, **kwargs)

        self.lock_patcher.stop()
        try:
            with patch("builtins.__import__", side_effect=without_fcntl):
                output, _ = self.run_command()
                self.assertIn("DRY-RUN", output)
                with self.assertRaisesMessage(CommandError, "unsupported"):
                    self.run_command("--apply")
            self.assertFalse(LeadAttachment.objects.exists())
            private_root = Path(self.temporary.name) / "private"
            self.assertFalse(private_root.exists())
        finally:
            self.lock_patcher.start()

    def test_postgresql_lock_does_not_import_fcntl(self):
        fake_connection = MagicMock(vendor="postgresql")
        cursor = fake_connection.cursor.return_value.__enter__.return_value
        cursor.fetchone.return_value = (True,)
        original_import = builtins.__import__

        def without_fcntl(name, *args, **kwargs):
            if name == "fcntl":
                raise AssertionError("PostgreSQL branch imported fcntl")
            return original_import(name, *args, **kwargs)

        self.lock_patcher.stop()
        try:
            with (
                patch.object(
                    migrate_legacy_lead_attachments,
                    "connection",
                    fake_connection,
                ),
                patch("builtins.__import__", side_effect=without_fcntl),
                migrate_legacy_lead_attachments.migration_lock(True),
            ):
                pass
        finally:
            self.lock_patcher.start()

        self.assertEqual(cursor.execute.call_count, 2)

    @patch("apps.leads.email_notifications.schedule_lead_notification")
    def test_apply_verifies_copy_preserves_state_and_is_idempotent(self, notify):
        content = b"verified synthetic bytes\n"
        lead = self.lead(content)
        original = {
            "submission_id": lead.submission_id,
            "submission_fingerprint": lead.submission_fingerprint,
            "notification_status": lead.notification_status,
            "notification_attempts": lead.notification_attempts,
            "created_at": lead.created_at,
            "updated_at": lead.updated_at,
            "attachment": lead.attachment.name,
        }
        output, _ = self.run_command("--apply")
        item = LeadAttachment.objects.get(legacy_source=lead)
        with item.file.open("rb") as document:
            self.assertEqual(document.read(), content)
        self.assertEqual(item.size, len(content))
        self.assertEqual(len(item.sha256), 64)
        self.assertIn("migrated=1", output)
        output, _ = self.run_command("--apply")
        self.assertIn("checked=0 migrated=0", output)
        output, _ = self.run_command("--verify")
        self.assertIn("verified=1", output)
        self.assertEqual(LeadAttachment.objects.count(), 1)
        lead.refresh_from_db()
        for field, value in original.items():
            self.assertEqual(getattr(lead, field).name if field == "attachment" else getattr(lead, field), value)
        notify.assert_not_called()

    def test_ids_and_limit(self):
        first, second, third = self.lead(), self.lead(), self.lead()
        self.run_command("--apply", "--lead-id", str(second.pk), "--lead-id", str(third.pk), "--limit", "1")
        self.assertEqual(list(LeadAttachment.objects.values_list("legacy_source_id", flat=True)), [second.pk])
        self.assertFalse(LeadAttachment.objects.filter(legacy_source=first).exists())

    def test_cursor_advances_batches_past_an_early_problem(self):
        first, second, third = self.lead(), self.lead(), self.lead()
        first.attachment.storage.delete(first.attachment.name)
        with self.assertRaises(CommandError):
            self.run_command("--apply", "--limit", "2")
        self.assertTrue(LeadAttachment.objects.filter(legacy_source=second).exists())
        self.run_command("--apply", "--after-id", str(second.pk), "--limit", "2")
        self.assertTrue(LeadAttachment.objects.filter(legacy_source=third).exists())

    def test_verify_detects_missing_and_corrupt_private_copies(self):
        missing, corrupt = self.lead(), self.lead()
        self.run_command("--apply")
        missing_copy = LeadAttachment.objects.get(legacy_source=missing)
        corrupt_copy = LeadAttachment.objects.get(legacy_source=corrupt)
        missing_copy.file.storage.delete(missing_copy.file.name)
        with corrupt_copy.file.storage.open(corrupt_copy.file.name, "wb") as document:
            document.write(b"corrupt")
        stdout, stderr = io.StringIO(), io.StringIO()
        with self.assertRaises(CommandError):
            call_command(
                "migrate_legacy_lead_attachments",
                "--verify",
                stdout=stdout,
                stderr=stderr,
            )
        diagnostics = stderr.getvalue()
        self.assertIn("reason=private_copy_unavailable", diagnostics)
        self.assertIn("reason=private_copy_mismatch", diagnostics)

    def test_verify_detects_incorrect_lead_relationship(self):
        source, other = self.lead(), self.lead()
        self.run_command("--apply", "--lead-id", str(source.pk))
        mapping = LeadAttachment.objects.get(legacy_source=source)
        LeadAttachment.objects.filter(pk=mapping.pk).update(lead=other)
        stdout, stderr = io.StringIO(), io.StringIO()
        with self.assertRaises(CommandError):
            call_command(
                "migrate_legacy_lead_attachments",
                "--verify",
                "--lead-id",
                str(source.pk),
                stdout=stdout,
                stderr=stderr,
            )
        self.assertIn("reason=mapping_lead_mismatch", stderr.getvalue())

    def test_deleting_migrated_lead_is_not_protected(self):
        lead = self.lead()
        self.run_command("--apply")
        lead.delete()
        self.assertFalse(LeadAttachment.objects.exists())

    def test_historical_multipart_retries_after_migration(self):
        submission_id = uuid.uuid4()
        values = {
            "name": "Synthetic",
            "company_name": "",
            "phone": "+0",
            "email": "",
            "description": "",
            "source_page": "",
            "source_system": "ee_site",
            "submission_id": submission_id,
        }
        original = SimpleUploadedFile("history.txt", b"same bytes")
        fingerprint = submission_fingerprint({**values, "attachment": original})
        original.seek(0)
        lead = Lead.objects.create(
            **values,
            submission_fingerprint=fingerprint,
            attachment=original,
        )
        self.run_command("--apply")

        identical = self.client.post(
            "/api/leads/",
            {**values, "submission_id": str(submission_id), "attachment": SimpleUploadedFile("history.txt", b"same bytes")},
        )
        changed = self.client.post(
            "/api/leads/",
            {**values, "submission_id": str(submission_id), "attachment": SimpleUploadedFile("history.txt", b"changed bytes")},
        )
        self.assertEqual(identical.status_code, 200)
        self.assertTrue(identical.json()["duplicate"])
        self.assertEqual(changed.status_code, 409)
        self.assertEqual(Lead.objects.get(pk=lead.pk).attachments.count(), 1)

    def test_missing_source_is_problem_and_other_records_continue(self):
        missing, good = self.lead(), self.lead()
        missing.attachment.storage.delete(missing.attachment.name)
        with self.assertRaises(CommandError):
            self.run_command("--apply")
        self.assertTrue(LeadAttachment.objects.filter(legacy_source=good).exists())
        self.assertFalse(LeadAttachment.objects.filter(legacy_source=missing).exists())

    @patch("apps.leads.management.commands.migrate_legacy_lead_attachments.hash_stored_file")
    def test_hash_mismatch_removes_attempt_copy(self, hash_file):
        self.lead(b"1234")
        hash_file.side_effect = [(4, "a" * 64), (4, "b" * 64)]
        with self.assertRaises(CommandError):
            self.run_command("--apply")
        self.assertFalse(LeadAttachment.objects.exists())
        self.assertEqual([p for p in (Path(self.temporary.name) / "private").rglob("*") if p.is_file()], [])

    @patch("apps.leads.models.LeadAttachment.objects.create")
    def test_database_failure_removes_attempt_copy(self, create):
        self.lead()
        create.side_effect = DatabaseError("synthetic database failure")
        with self.assertRaises(CommandError):
            self.run_command("--apply")
        self.assertFalse(LeadAttachment.objects.exists())
        self.assertEqual([p for p in (Path(self.temporary.name) / "private").rglob("*") if p.is_file()], [])

    @patch("apps.leads.models.LeadAttachment.objects.create")
    def test_cleanup_failure_is_diagnosed(self, create):
        self.lead()
        create.side_effect = DatabaseError("synthetic database failure")
        storage = LeadAttachment._meta.get_field("file").storage
        with patch.object(storage, "delete", side_effect=OSError("cleanup failed")):
            stdout, stderr = io.StringIO(), io.StringIO()
            with self.assertRaises(CommandError):
                call_command("migrate_legacy_lead_attachments", "--apply", stdout=stdout, stderr=stderr)
        self.assertIn("reason=cleanup_delete_failed", stderr.getvalue())

    @patch("apps.leads.models.LeadAttachment.objects.create")
    def test_uncertain_database_reference_preserves_copy(self, create):
        self.lead()
        create.side_effect = DatabaseError("synthetic database failure")
        with patch.object(
            QuerySet,
            "exists",
            side_effect=[False, DatabaseError("reference unavailable")],
        ):
            with self.assertRaises(CommandError):
                self.run_command("--apply")
        private_files = [
            path
            for path in (Path(self.temporary.name) / "private").rglob("*")
            if path.is_file()
        ]
        self.assertEqual(len(private_files), 1)

    def test_private_storage_write_failure_does_not_create_mapping(self):
        self.lead()
        with patch(
            "apps.leads.models.PrivateLeadAttachmentStorage.save",
            side_effect=OSError("synthetic private storage failure"),
        ):
            with self.assertRaises(CommandError):
                self.run_command("--apply")
        self.assertFalse(LeadAttachment.objects.exists())

    def test_migrated_document_is_not_duplicated_in_email(self):
        lead = self.lead()
        self.run_command("--apply")
        with patch("django.core.mail.EmailMessage.send", return_value=1), patch(
            "django.core.mail.EmailMessage.attach"
        ) as attach:
            sent, error = _send_email(Lead.objects.get(pk=lead.pk))
        self.assertTrue(sent)
        self.assertEqual(error, "")
        attach.assert_called_once()

    def test_migrated_document_uses_protected_admin_download(self):
        lead = self.lead()
        self.run_command("--apply")
        attachment = LeadAttachment.objects.get()
        user = get_user_model().objects.create_superuser(
            username="migration-admin", password="unused"
        )
        request = RequestFactory().get("/")
        request.user = user
        response = LeadAdmin(Lead, AdminSite()).download_attachment(request, attachment.pk)
        try:
            self.assertEqual(response.status_code, 200)
            self.assertEqual(
                b"".join(response.streaming_content),
                b"synthetic historical document",
            )
        finally:
            response.close()
