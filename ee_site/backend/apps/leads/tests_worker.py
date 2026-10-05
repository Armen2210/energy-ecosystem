import io
from unittest.mock import patch

from django.contrib.admin.sites import AdminSite
from django.contrib.auth.models import AnonymousUser
from django.core.management import call_command
from django.core.management.base import CommandError
from django.db import DatabaseError
from django.test import RequestFactory, TestCase, override_settings

from apps.leads.admin import LeadAdmin
from apps.leads.email_notifications import (
    NotificationAttemptResult,
    NotificationErrorCode,
    send_lead_notification,
)
from apps.leads.models import Lead


@override_settings(
    LEAD_NOTIFICATION_MODE="background",
    LEAD_NOTIFICATION_EMAIL="manager@example.test",
)
class BackgroundNotificationTests(TestCase):
    def lead(self, **values):
        defaults = {"name": "Synthetic", "phone": "+70000000000"}
        defaults.update(values)
        return Lead.objects.create(**defaults)

    @patch("apps.leads.email_notifications.EmailMessage.send")
    def test_public_create_leaves_durable_pending_without_smtp(self, send):
        with self.captureOnCommitCallbacks(execute=True) as callbacks:
            response = self.client.post(
                "/api/leads/",
                {"name": "Synthetic", "phone": "+70000000000"},
            )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(callbacks, [])
        self.assertEqual(set(response.json()), {"id"})
        self.assertEqual(
            Lead.objects.get().notification_status, Lead.NotificationStatus.PENDING
        )
        send.assert_not_called()

    @patch("apps.leads.email_notifications.EmailMessage.send", return_value=1)
    def test_one_shot_processes_only_pending_and_can_be_run_again(self, send):
        first = self.lead()
        for status in ("sending", "unknown", "sent", "failed"):
            self.lead(notification_status=status)

        call_command("process_lead_notifications", limit=1)
        first.refresh_from_db()
        self.assertEqual(first.notification_status, Lead.NotificationStatus.SENT)
        second = self.lead()
        call_command("process_lead_notifications", limit=1)
        second.refresh_from_db()
        self.assertEqual(second.notification_status, Lead.NotificationStatus.SENT)
        self.assertEqual(send.call_count, 2)

    @patch("apps.leads.email_notifications.EmailMessage.send", return_value=1)
    def test_atomic_second_claim_is_skipped(self, send):
        lead = self.lead()
        lead.notification_status = Lead.NotificationStatus.SENDING
        lead.save(update_fields=("notification_status",))
        result = send_lead_notification(lead.pk)
        self.assertEqual(result.outcome, result.SKIPPED)
        send.assert_not_called()

    @patch(
        "apps.leads.email_notifications.EmailMessage.send",
        side_effect=(OSError("synthetic"), 1),
    )
    def test_one_failure_does_not_stop_independent_record(self, send):
        first = self.lead()
        second = self.lead()
        call_command("process_lead_notifications", limit=2)
        first.refresh_from_db()
        second.refresh_from_db()
        self.assertEqual(first.notification_status, Lead.NotificationStatus.FAILED)
        self.assertEqual(second.notification_status, Lead.NotificationStatus.SENT)
        self.assertEqual(send.call_count, 2)

    @patch("apps.leads.management.commands.process_lead_notifications.send_lead_notification")
    def test_unexpected_record_error_does_not_skip_next_record(self, send):
        self.lead()
        self.lead()
        send.side_effect = (
            RuntimeError("sensitive synthetic details"),
            NotificationAttemptResult(NotificationAttemptResult.SENT),
        )
        stderr = io.StringIO()

        call_command("process_lead_notifications", limit=2, stderr=stderr)

        self.assertEqual(send.call_count, 2)
        self.assertIn("code=unexpected_record_error", stderr.getvalue())
        self.assertNotIn("sensitive synthetic details", stderr.getvalue())

    @patch("apps.leads.management.commands.process_lead_notifications.time.sleep")
    @patch("apps.leads.management.commands.process_lead_notifications.send_lead_notification")
    def test_database_result_pauses_continuous_worker(self, send, sleep):
        self.lead()
        send.return_value = NotificationAttemptResult(
            NotificationAttemptResult.FAILED,
            NotificationErrorCode.STATE_CLAIM_FAILED,
        )
        sleep.side_effect = KeyboardInterrupt
        stderr = io.StringIO()

        call_command(
            "process_lead_notifications",
            continuous=True,
            interval=0.01,
            stderr=stderr,
        )

        sleep.assert_called_once_with(0.01)
        self.assertIn("stage=process_result", stderr.getvalue())
        self.assertIn("code=state_claim_failed", stderr.getvalue())

    @patch("apps.leads.management.commands.process_lead_notifications.send_lead_notification")
    @patch("apps.leads.management.commands.process_lead_notifications.signal.signal")
    def test_stop_signal_prevents_next_claim(self, register_signal, send):
        self.lead()
        self.lead()
        handlers = {}

        def register(sig, handler):
            if callable(handler):
                handlers[sig] = handler
            return None

        register_signal.side_effect = register

        def stop_after_first(lead_id):
            handlers[next(iter(handlers))](None, None)
            return NotificationAttemptResult(NotificationAttemptResult.SENT)

        send.side_effect = stop_after_first
        call_command("process_lead_notifications", limit=2)
        self.assertEqual(send.call_count, 1)

    @patch("apps.leads.email_notifications._store_notification_result")
    @patch("apps.leads.email_notifications.EmailMessage.send", return_value=1)
    def test_result_storage_failure_stays_sending_and_is_not_retried(
        self, email_send, store_result
    ):
        ambiguous = self.lead()
        following = self.lead()
        store_result.side_effect = DatabaseError("sensitive database details")
        stderr = io.StringIO()

        with self.assertLogs("apps.leads.email_notifications", level="ERROR"):
            with self.assertRaises(CommandError):
                call_command(
                    "process_lead_notifications", limit=2, stderr=stderr
                )

        ambiguous.refresh_from_db()
        following.refresh_from_db()
        self.assertEqual(
            ambiguous.notification_status, Lead.NotificationStatus.SENDING
        )
        self.assertEqual(
            following.notification_status, Lead.NotificationStatus.PENDING
        )
        self.assertEqual(email_send.call_count, 1)

        store_result.side_effect = None
        store_result.return_value = 1
        call_command("process_lead_notifications", limit=2)
        ambiguous.refresh_from_db()
        self.assertEqual(
            ambiguous.notification_status, Lead.NotificationStatus.SENDING
        )
        self.assertEqual(email_send.call_count, 2)

    @patch("apps.leads.admin.send_lead_notification")
    def test_admin_queues_failed_without_attempt_or_smtp(self, send):
        failed = [
            self.lead(
                notification_status=Lead.NotificationStatus.FAILED,
                notification_attempts=3,
            )
            for _ in range(7)
        ]
        pending = self.lead(notification_status=Lead.NotificationStatus.PENDING)
        request = RequestFactory().post("/admin/leads/")
        request.user = AnonymousUser()
        lead_admin = LeadAdmin(Lead, AdminSite())
        with patch.object(lead_admin, "has_change_permission", return_value=True):
            with patch.object(lead_admin, "message_user") as message:
                lead_admin.retry_failed_notifications(request, Lead.objects.all())
        self.assertEqual(
            Lead.objects.filter(notification_status=Lead.NotificationStatus.PENDING).count(),
            6,
        )
        attempts = dict(
            Lead.objects.filter(pk__in=[item.pk for item in failed] + [pending.pk])
            .values_list("pk", "notification_attempts")
        )
        self.assertTrue(all(attempts[item.pk] == 3 for item in failed[:5]))
        self.assertEqual(attempts[pending.pk], 0)
        self.assertIn("поставлено в очередь — 5", message.call_args.args[1])
        send.assert_not_called()

        # Repeating the action cannot enqueue already-pending rows or consume
        # attempt counters, but may enqueue the two remaining failed rows.
        with patch.object(lead_admin, "has_change_permission", return_value=True):
            with patch.object(lead_admin, "message_user"):
                lead_admin.retry_failed_notifications(request, Lead.objects.all())
        self.assertFalse(
            Lead.objects.filter(notification_status=Lead.NotificationStatus.FAILED).exists()
        )
        self.assertTrue(
            all(value == 3 for value in Lead.objects.exclude(pk=pending.pk).values_list(
                "notification_attempts", flat=True
            ))
        )

    def test_diagnostics_is_read_only(self):
        pending = self.lead()
        self.lead(notification_status=Lead.NotificationStatus.FAILED)
        before = list(Lead.objects.values())
        output = io.StringIO()
        call_command("lead_notification_status", stdout=output)
        self.assertIn("pending=1", output.getvalue())
        self.assertEqual(before, list(Lead.objects.values()))
        pending.refresh_from_db()


class NotificationModeGuardTests(TestCase):
    @override_settings(LEAD_NOTIFICATION_MODE="sync")
    def test_worker_refuses_sync_mode(self):
        with self.assertRaisesMessage(CommandError, "refusing to mix"):
            call_command("process_lead_notifications")

    @override_settings(LEAD_NOTIFICATION_MODE="background")
    def test_worker_rejects_non_finite_and_non_positive_intervals(self):
        for interval in (float("nan"), float("inf"), float("-inf"), 0, -1):
            with self.subTest(interval=interval):
                with self.assertRaisesMessage(CommandError, "positive finite"):
                    call_command("process_lead_notifications", interval=interval)

    def test_diagnostics_rejects_non_finite_and_non_positive_thresholds(self):
        for minutes in (float("nan"), float("inf"), float("-inf"), 0, -1):
            with self.subTest(minutes=minutes):
                with self.assertRaisesMessage(CommandError, "positive finite"):
                    call_command(
                        "lead_notification_status", sending_older_than=minutes
                    )
