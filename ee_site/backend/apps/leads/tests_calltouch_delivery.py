import io
import json
from unittest.mock import Mock, patch
from urllib.parse import parse_qs
from uuid import uuid4

from django.db import transaction
from django.test import TestCase, override_settings

from .calltouch_delivery import deliver, send
from .lead_creation import create_lead
from .models import CalltouchDelivery, Lead


@override_settings(CALLTOUCH_DELIVERY_ENABLED=True, CALLTOUCH_SITE_ID="12345")
class CalltouchDeliveryTests(TestCase):
    def setUp(self):
        self.data = dict(
            name="Test", phone="+7 (999) 000-00-01", email="fake@example.test",
            description="private", source_page="/solutions/bmk?private=abc",
            direction_type="product", direction_slug="bmk", submission_id=uuid4(),
        )

    def create(self):
        return create_lead({**self.data, "calltouch_tracking": {"enabled": True, "session_id": "123"}})

    def test_duplicate_creates_only_one_delivery(self):
        lead, created = self.create()
        self.assertTrue(created)
        self.assertEqual(self.create(), (lead, False))
        self.assertEqual(CalltouchDelivery.objects.count(), 1)

    def test_rollback_leaves_no_delivery(self):
        with self.assertRaises(RuntimeError), transaction.atomic():
            self.create()
            raise RuntimeError
        self.assertFalse(Lead.objects.exists())
        self.assertFalse(CalltouchDelivery.objects.exists())

    def test_without_consent_no_delivery(self):
        create_lead(self.data)
        self.assertFalse(CalltouchDelivery.objects.exists())

    @override_settings(CALLTOUCH_DELIVERY_ENABLED=False)
    def test_disabled_does_not_queue(self):
        self.create()
        self.assertFalse(CalltouchDelivery.objects.exists())

    def test_timeout_is_not_retried(self):
        lead, _ = self.create()
        job = lead.calltouch_delivery
        transport = Mock(side_effect=TimeoutError)
        self.assertTrue(deliver(job, transport=transport))
        self.assertFalse(deliver(job, transport=transport))
        transport.assert_called_once()
        job.refresh_from_db()
        self.assertEqual(job.state, CalltouchDelivery.State.UNCERTAIN)

    def test_success_is_recorded_once(self):
        lead, _ = self.create()
        job = lead.calltouch_delivery
        transport = Mock(return_value=4321)
        self.assertTrue(deliver(job, transport=transport))
        self.assertFalse(deliver(job, transport=transport))
        job.refresh_from_db()
        self.assertEqual((job.state, job.request_id), (CalltouchDelivery.State.SENT, 4321))
        transport.assert_called_once()

    @patch("apps.leads.calltouch_delivery.build_opener")
    def test_http_contract_and_minimal_fields(self, opener):
        lead, _ = self.create()
        job = lead.calltouch_delivery
        reply = opener.return_value.open
        reply.return_value = io.BytesIO(json.dumps({"requestId": 4321, "requestNumber": f"ee-{lead.pk}"}).encode())
        self.assertEqual(send(job), 4321)
        request = reply.call_args.args[0]
        self.assertEqual(request.get_method(), "POST")
        self.assertTrue(request.full_url.endswith("/12345/register/"))
        self.assertEqual(parse_qs(request.data.decode()), {
            "fio": ["Test"], "email": ["fake@example.test"], "phoneNumber": ["79990000001"], "requestNumber": [f"ee-{lead.pk}"],
            "subject": ["Заявка с сайта Энергоэффект"], "tags": ["BMK"],
            "requestUrl": ["https://www.energoeffekt-rostov.ru/solutions/bmk"], "sessionId": ["123"],
        })
        reply.return_value = io.BytesIO(b'{"error":"test"}')
        with self.assertRaisesRegex(ValueError, "unconfirmed_registration"):
            send(job)

    @override_settings(LEAD_RATE_LIMIT_ENABLED=False)
    def test_public_contract_denial_retry_and_server_owned_destination(self):
        base = {**self.data, "submission_id": str(self.data["submission_id"])}
        tracking = json.dumps({"enabled": True, "session_id": "987"})
        first = self.client.post("/api/leads/", {**base, "calltouch_tracking": tracking, "calltouch_site_id": "999"})
        self.assertEqual(first.status_code, 201, first.content)
        job = CalltouchDelivery.objects.get()
        self.assertEqual((job.session_id, job.site_id), ("987", "12345"))
        duplicate = self.client.post("/api/leads/", base)
        self.assertEqual(duplicate.status_code, 200, duplicate.content)
        self.assertTrue(duplicate.json()["duplicate"])
        for tracking in [None, {"enabled": False}]:
            data = {**base, "submission_id": str(uuid4())}
            if tracking is not None:
                data["calltouch_tracking"] = json.dumps(tracking)
            self.assertEqual(self.client.post("/api/leads/", data).status_code, 201)
        self.assertEqual(CalltouchDelivery.objects.count(), 1)

    def test_optional_queue_failure_does_not_rollback_operational_lead(self):
        with patch("apps.leads.calltouch_delivery.enqueue", side_effect=RuntimeError):
            lead, created = self.create()
        self.assertTrue(created)
        self.assertTrue(Lead.objects.filter(pk=lead.pk).exists())
        self.assertFalse(CalltouchDelivery.objects.exists())

    def test_general_and_service_forms_are_exported_without_session(self):
        for direction in [({}, "/"), ({"direction_type":"service", "direction_slug":"design"}, "/services/design")]:
            data = {**self.data, "direction_type":"", "direction_slug":"", **direction[0],
                    "source_page":direction[1], "submission_id":uuid4(), "calltouch_tracking":{"enabled":True}}
            lead, _ = create_lead(data)
            self.assertEqual(lead.calltouch_delivery.session_id, "")
        self.assertEqual(CalltouchDelivery.objects.count(), 2)

    def test_later_retry_does_not_opt_in_originally_untracked_submission(self):
        lead, _ = create_lead(self.data)
        repeated, created = self.create()
        self.assertEqual(repeated.pk, lead.pk)
        self.assertFalse(created)
        self.assertFalse(CalltouchDelivery.objects.exists())

    @patch("apps.leads.calltouch_delivery.build_opener")
    def test_invalid_reply_requires_reconciliation(self, opener):
        lead, _ = self.create()
        opener.return_value.open.return_value = io.BytesIO(b'{"requestId":1,"requestNumber":"wrong"}')
        deliver(lead.calltouch_delivery)
        lead.calltouch_delivery.refresh_from_db()
        self.assertEqual(lead.calltouch_delivery.state, CalltouchDelivery.State.UNCERTAIN)

    def test_stale_sending_is_not_automatically_retried(self):
        lead, _ = self.create()
        job=lead.calltouch_delivery
        job.state=CalltouchDelivery.State.SENDING;job.save()
        transport=Mock()
        self.assertFalse(deliver(job, transport=transport))
        transport.assert_not_called()

    def test_worker_status_and_manual_requeue_never_send(self):
        from django.core.management import call_command
        from django.core.management.base import CommandError
        lead, _ = self.create()
        job = lead.calltouch_delivery
        job.state = CalltouchDelivery.State.UNCERTAIN
        job.save()
        with patch('apps.leads.management.commands.process_calltouch_deliveries.deliver') as transport:
            call_command('process_calltouch_deliveries', status=True, stdout=io.StringIO())
            call_command('process_calltouch_deliveries', requeue_checked=lead.pk, stdout=io.StringIO())
            transport.assert_not_called()
            with self.assertRaises(CommandError):
                call_command('process_calltouch_deliveries', requeue_checked=lead.pk, stdout=io.StringIO())
        job.refresh_from_db()
        self.assertEqual(job.state, CalltouchDelivery.State.PENDING)

    @override_settings(CALLTOUCH_SITE_ID='98765')
    def test_existing_job_is_not_redirected_to_another_project(self):
        from .models import CalltouchDelivery
        lead, _ = self.create()
        job = lead.calltouch_delivery
        job.site_id = '12345'; job.save()
        transport = Mock()
        self.assertFalse(deliver(job, transport=transport))
        transport.assert_not_called()
