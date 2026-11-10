import io
import json
from unittest.mock import patch
from urllib.parse import parse_qs
from uuid import uuid4

from django.test import TestCase

from .calltouch_delivery import send
from .lead_creation import create_lead
from .models import Lead, CalltouchDelivery
from .phone import normalize_lead_phone


class LeadPhoneTests(TestCase):
    def test_russian_and_foreign_numbers(self):
        for phone in ["(918) 310-68-88", "89183106888", "79183106888", "+7 (918) 310-68-88"]:
            self.assertEqual(normalize_lead_phone(phone), "+79183106888")
        for phone in ["", "918", "+12025550123", "+441234567890", "+1234567890"]:
            self.assertEqual(normalize_lead_phone(phone), phone)

    def test_save_normalizes_without_breaking_same_payload_retry(self):
        for phone in ["(918) 310-68-88", "89183106888", "+7 (918) 310-68-88"]:
            data = dict(name="Test", phone=phone, submission_id=uuid4())
            lead, created = create_lead(data)
            self.assertTrue(created)
            self.assertEqual(Lead.objects.get(pk=lead.pk).phone, "+79183106888")
            duplicate, created = create_lead(data)
            self.assertFalse(created)
            self.assertEqual(duplicate.pk, lead.pk)

    @patch("apps.leads.calltouch_delivery.build_opener")
    def test_calltouch_exports_legacy_ten_digit_phone(self, opener):
        lead = Lead.objects.create(name="Test", phone="(918) 310-68-88")
        job = CalltouchDelivery.objects.create(lead=lead, site_id="12345")
        opener.return_value.open.return_value = io.BytesIO(json.dumps({
            "requestId": 123, "requestNumber": f"ee-{lead.pk}"
        }).encode())
        self.assertEqual(send(job), 123)
        payload = parse_qs(opener.return_value.open.call_args.args[0].data.decode())
        self.assertEqual(payload["phoneNumber"], ["79183106888"])
