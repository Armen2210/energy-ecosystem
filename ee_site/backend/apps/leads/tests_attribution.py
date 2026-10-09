import json
import time
import uuid
import tempfile
from pathlib import Path
from unittest.mock import patch

from django.contrib.admin.sites import AdminSite
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from rest_framework.test import APITestCase

from apps.leads.models import Lead, LeadAttachment
from apps.leads.admin import LeadAdmin
from apps.leads.tests import LeadTestMixin
from apps.leads.lead_creation import submission_fingerprint
from apps.leads.serializers import LeadSerializer


def attribution(source="direct_ads"):
    touch = {"at": int(time.time() * 1000), "tags": {"utm_source": source, "utm_medium": "cpc", "yclid": "123456789012345678"}}
    return {"version": 1, "first": touch, "last": touch}


@override_settings(LEAD_NOTIFICATION_MODE="background")
class AttributionTests(LeadTestMixin, APITestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        temp = tempfile.TemporaryDirectory()
        cls.addClassCleanup(temp.cleanup)
        settings = override_settings(LEAD_PRIVATE_ATTACHMENT_ROOT=Path(temp.name) / "private")
        settings.enable()
        cls.addClassCleanup(settings.disable)

    def post(self, **extra):
        return self.client.post(self.endpoint, self.valid_payload(**extra), format="multipart")

    def test_old_client_and_minimal_public_response(self):
        response = self.post()
        self.assertEqual(response.status_code, 201)
        self.assertEqual(set(response.data), {"id"})
        self.assertEqual(Lead.objects.get().campaign_attribution, {})

    def test_valid_metadata_saved_and_hidden(self):
        value = attribution()
        response = self.post(campaign_attribution=json.dumps(value), direction_type="product", direction_slug="btp")
        self.assertEqual(response.status_code, 201, response.data)
        lead = Lead.objects.get()
        self.assertEqual(lead.campaign_attribution, value)
        self.assertEqual(lead.direction_slug, "btp")
        data = LeadSerializer(lead).data
        self.assertNotIn("campaign_attribution", data)
        self.assertNotIn("direction_slug", data)
        self.assertIn("direct_ads", LeadAdmin(Lead, AdminSite()).campaign_summary(lead))
        self.assertEqual(LeadAdmin(Lead, AdminSite()).direction_summary(lead), "БТП «Энерголайн»")

    def test_direction_without_consent_or_campaign(self):
        response = self.post(direction_type="service", direction_slug="design")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Lead.objects.get().campaign_attribution, {})

    def test_reject_invalid_direction(self):
        for values in ({"direction_type": "product", "direction_slug": "design"}, {"direction_slug": "btp"}, {"direction_type": "service"}, {"direction_type": "unknown", "direction_slug": "btp"}):
            with self.subTest(values=values):
                self.assertEqual(self.post(**values).status_code, 400)
        self.assertEqual(Lead.objects.count(), 0)

    def test_reject_unbounded_or_personal_campaign_values(self):
        for value in ["John Doe", "test@example.com", "+79991234567", "https://example.com", "x" * 65, "ab1234567", "Иван", "a.b", "abc%20def"]:
            with self.subTest(value=value):
                self.assertEqual(self.post(campaign_attribution=json.dumps(attribution(value))).status_code, 400)
        self.assertEqual(self.post(campaign_attribution="x" * 2049).status_code, 400)
        self.assertEqual(self.post(campaign_attribution="not-json").status_code, 400)
        self.assertEqual(Lead.objects.count(), 0)

    def test_reject_unknown_keys_types_times_and_version(self):
        malformed = [[], None, {**attribution(), "version": 2}]
        data = attribution(); data["first"]["tags"]["email"] = "abc"; malformed.append(data)
        data = attribution(); data["first"]["at"] = True; malformed.append(data)
        data = attribution(); data["first"]["at"] += 900000; malformed.append(data)
        data = attribution(); data["last"]["tags"]["yclid"] = "abc"; malformed.append(data)
        for value in malformed:
            with self.subTest(value=value):
                self.assertEqual(self.post(campaign_attribution=json.dumps(value)).status_code, 400)

    @patch("apps.leads.lead_creation.schedule_lead_notification")
    def test_retry_metadata_changed_or_removed_first_write_wins(self, notify):
        key = str(uuid.uuid4())
        first = attribution()
        def document(content=b"synthetic"):
            return SimpleUploadedFile("test.txt", content, content_type="text/plain")
        response = self.post(submission_id=key, campaign_attribution=json.dumps(first), direction_type="product", direction_slug="btp", attachments=document())
        self.assertEqual(response.status_code, 201, response.data)
        for metadata in ({"campaign_attribution": json.dumps(attribution("other_campaign")), "direction_type": "service", "direction_slug": "design"}, {}):
            repeated = self.post(submission_id=key, attachments=document(), **metadata)
            self.assertEqual(repeated.status_code, 200, repeated.data)
            self.assertEqual(repeated.data, {"id": response.data["id"], "duplicate": True})
        self.assertEqual(Lead.objects.count(), 1)
        self.assertEqual(LeadAttachment.objects.count(), 1)
        notify.assert_called_once()
        lead = Lead.objects.get()
        self.assertEqual(lead.campaign_attribution, first)
        self.assertEqual(lead.direction_slug, "btp")
        self.assertEqual(self.post(submission_id=key, description="Edited content", attachments=document()).status_code, 409)
        self.assertEqual(self.post(submission_id=key, attachments=document(b"edited")).status_code, 409)

    def test_legacy_fingerprint_format_unchanged(self):
        payload = self.valid_payload()
        self.assertEqual(submission_fingerprint(payload), submission_fingerprint({**payload, "direction_type": "product", "direction_slug": "btp", "campaign_attribution": attribution()}))
