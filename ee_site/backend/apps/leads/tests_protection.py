import io
import os
import sqlite3
import subprocess
import sys
import tempfile
import uuid
from pathlib import Path
from unittest.mock import patch

from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.files.uploadhandler import TemporaryFileUploadHandler
from django.test import RequestFactory, SimpleTestCase, override_settings
from rest_framework.test import APITestCase

from .models import Lead, LeadAttachment
from .request_protection import (
    client_address,
)
from .upload_protection import LeadMultiPartParser, LeadUploadRejected, LimitedStream


@override_settings(LEAD_RATE_LIMIT_ENABLED=True, LEAD_NOTIFICATION_MODE="background")
class LeadProtectionTests(APITestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name)
        self.settings_override = override_settings(
            LEAD_RATE_STORE=self.root / "limits.sqlite3",
            LEAD_RATE_BURST_LIMIT=2,
            LEAD_RATE_BURST_SECONDS=60,
            LEAD_RATE_SUSTAINED_LIMIT=3,
            LEAD_RATE_SUSTAINED_SECONDS=3600,
            LEAD_TRUSTED_PROXY_NETWORKS=[],
            LEAD_TRUST_UNIX_SOCKET_PROXY=False,
            LEAD_PRIVATE_ATTACHMENT_ROOT=self.root / "private",
            FILE_UPLOAD_TEMP_DIR=self.directory.name,
        )
        self.settings_override.enable()
        self.addCleanup(self.settings_override.disable)

    def post(self, address="192.0.2.1", **values):
        payload = {"name": "Synthetic", "phone": "+70000000000"}
        payload.update(values)
        return self.client.post("/api/leads/", payload, format="multipart", REMOTE_ADDR=address)

    def files(self):
        return list((self.root / "private").rglob("*")) if (self.root / "private").exists() else []

    @patch("apps.leads.lead_creation.schedule_lead_notification")
    def test_burst_rejects_before_parsing_hashing_storage_and_queue(self, schedule):
        with patch("apps.leads.request_protection.time.time", return_value=1000):
            self.assertEqual(self.post().status_code, 201)
            self.assertEqual(self.post().status_code, 201)
            with patch.object(LeadMultiPartParser, "parse") as parser, patch(
                "apps.leads.lead_creation.submission_fingerprint"
            ) as fingerprint, patch("apps.leads.views.create_lead") as create:
                rejected = self.post(attachments=[SimpleUploadedFile("a.txt", b"data")])
            parser.assert_not_called()
            fingerprint.assert_not_called()
            create.assert_not_called()
        self.assertEqual(rejected.status_code, 429)
        self.assertEqual(rejected.data["code"], "lead_rate_limited")
        self.assertEqual(rejected.data["retry_after"], 60)
        self.assertEqual(rejected["Retry-After"], "60")
        self.assertEqual(Lead.objects.count(), 2)
        self.assertFalse(LeadAttachment.objects.exists())
        self.assertEqual(schedule.call_count, 2)
        self.assertEqual(self.files(), [])
        with patch("apps.leads.request_protection.time.time", return_value=1060):
            self.assertEqual(self.post().status_code, 201)

    def test_sustained_limit_and_other_clients(self):
        with patch("apps.leads.request_protection.time.time", return_value=1000):
            self.assertEqual(self.post().status_code, 201)
            self.assertEqual(self.post().status_code, 201)
        with patch("apps.leads.request_protection.time.time", return_value=1060):
            self.assertEqual(self.post().status_code, 201)
            response = self.post()
            self.assertEqual(response.status_code, 429)
            self.assertEqual(response.data["retry_after"], 3540)
            self.assertEqual(self.post(address="192.0.2.2").status_code, 201)
        with patch("apps.leads.request_protection.time.time", return_value=4600):
            self.assertEqual(self.post().status_code, 201)

    def test_untrusted_headers_cannot_change_bucket(self):
        for index in range(3):
            response = self.client.post(
                "/api/leads/", {"name": "Synthetic", "phone": "123"},
                format="multipart", REMOTE_ADDR="192.0.2.1",
                HTTP_X_REAL_IP=f"198.51.100.{index + 1}",
                HTTP_X_FORWARDED_FOR=f"203.0.113.{index + 1}",
            )
            self.assertEqual(response.status_code, 201 if index < 2 else 429)

    @override_settings(LEAD_TRUSTED_PROXY_NETWORKS=["127.0.0.1/32"])
    def test_trusted_proxy_separates_clients_and_requires_single_valid_ip(self):
        for address in ("192.0.2.1", "192.0.2.2"):
            for _ in range(2):
                response = self.client.post(
                    "/api/leads/", {"name": "Synthetic", "phone": "123"},
                    format="multipart", HTTP_X_REAL_IP=address,
                    HTTP_X_FORWARDED_FOR="evil", REMOTE_ADDR="127.0.0.1",
                )
                self.assertEqual(response.status_code, 201)
        for value in ("", "not-an-ip", "192.0.2.1, 192.0.2.2"):
            with patch.object(LeadMultiPartParser, "parse") as parser:
                response = self.client.post(
                    "/api/leads/", {}, format="multipart", REMOTE_ADDR="127.0.0.1",
                    HTTP_X_REAL_IP=value,
                )
            self.assertEqual(response.status_code, 503)
            parser.assert_not_called()

    @override_settings(LEAD_RATE_STORE="/missing-cloud-test-directory/limits.sqlite3")
    def test_store_failure_is_closed_and_not_429(self):
        with patch.object(LeadMultiPartParser, "parse") as parser:
            response = self.post()
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.data["code"], "lead_protection_unavailable")
        parser.assert_not_called()
        self.assertFalse(Lead.objects.exists())

    @patch("apps.leads.lead_creation.schedule_lead_notification")
    def test_idempotent_retry_is_limited_then_reuses_original_files_and_job(self, schedule):
        key = str(uuid.uuid4())
        def submit():
            return self.post(submission_id=key, attachments=[SimpleUploadedFile("a.txt", b"same")])
        with patch("apps.leads.request_protection.time.time", return_value=1000):
            first = submit()
            self.assertEqual(first.status_code, 201)
            self.assertEqual(submit().status_code, 200)
            self.assertEqual(submit().status_code, 429)
        with patch("apps.leads.request_protection.time.time", return_value=1060):
            retry = submit()
        self.assertEqual(retry.data, {"id": first.data["id"], "duplicate": True})
        self.assertEqual(Lead.objects.count(), 1)
        self.assertEqual(LeadAttachment.objects.count(), 1)
        self.assertEqual(len([p for p in self.files() if p.is_file()]), 1)
        schedule.assert_called_once()

    @override_settings(LEAD_TRUST_UNIX_SOCKET_PROXY=True)
    def test_unix_socket_opt_in_requires_overwritten_header(self):
        for address in ("192.0.2.1", "192.0.2.2"):
            response = self.client.post(
                "/api/leads/", {"name": "Synthetic", "phone": "123"},
                format="multipart", REMOTE_ADDR="", HTTP_X_REAL_IP=address,
            )
            self.assertEqual(response.status_code, 201)
        response = self.client.post("/api/leads/", {}, format="multipart", REMOTE_ADDR="")
        self.assertEqual(response.status_code, 503)

    def test_locked_store_fails_closed_without_parsing(self):
        lock = sqlite3.connect(self.root / "limits.sqlite3", isolation_level=None)
        try:
            lock.execute("BEGIN IMMEDIATE")
            with patch.object(LeadMultiPartParser, "parse") as parser:
                response = self.post()
            self.assertEqual(response.status_code, 503)
            parser.assert_not_called()
            self.assertFalse(Lead.objects.exists())
        finally:
            lock.close()

    def test_other_routes_and_methods_do_not_consume_limit(self):
        with patch("apps.leads.views.consume_client") as consume:
            for url in ("/admin/", "/does-not-exist/"):
                response = self.client.get(url)
                response.close()
            response = self.client.get("/api/leads/")
            self.assertEqual(response.status_code, 405)
            self.client.options("/api/leads/")
        consume.assert_not_called()

    @override_settings(LEAD_RATE_LIMIT_ENABLED=False, LEAD_MAX_REQUEST_SIZE=100)
    def test_content_length_rejection_before_parser(self):
        with patch.object(LeadMultiPartParser, "parse") as parser:
            response = self.post(attachments=[SimpleUploadedFile("big.txt", b"x" * 100)])
        self.assertEqual(response.status_code, 413)
        parser.assert_not_called()
        self.assertFalse(Lead.objects.exists())

    @override_settings(
        LEAD_RATE_LIMIT_ENABLED=False, FILE_UPLOAD_MAX_MEMORY_SIZE=0,
        LEAD_MAX_FILE_SIZE=70_000, LEAD_MAX_TOTAL_FILE_SIZE=100_000,
    )
    @patch("apps.leads.lead_creation.schedule_lead_notification")
    def test_direct_multipart_limits_close_completed_and_current_temp_files(self, schedule):
        cases = (
            [b"x" * 70_001],
            [b"x" * 60_000, b"y" * 40_001],
            [b"x"] * 11,
            [b""],
        )
        original = TemporaryFileUploadHandler.receive_data_chunk
        written = []
        def receive(handler, data, start):
            written.append(len(data))
            return original(handler, data, start)
        with patch("apps.leads.lead_creation.submission_fingerprint") as fingerprint:
            for contents in cases:
                written.clear()
                with self.subTest(sizes=[len(item) for item in contents]), patch.object(
                    TemporaryFileUploadHandler, "receive_data_chunk", receive
                ):
                    response = self.post(submission_id=str(uuid.uuid4()), attachments=[
                        SimpleUploadedFile(f"file-{index}.bin", content)
                        for index, content in enumerate(contents)
                    ])
                    self.assertEqual(response.status_code, 400)
                    self.assertEqual(list(self.root.glob("*.upload*")), [])
                    self.assertEqual(self.files(), [])
                    self.assertFalse(Lead.objects.exists())
                    self.assertFalse(LeadAttachment.objects.exists())
                    self.assertLessEqual(sum(written), 100_000)
            fingerprint.assert_not_called()
        schedule.assert_not_called()

    @override_settings(LEAD_RATE_LIMIT_ENABLED=False, LEAD_MAX_FORM_FIELDS=2, FILE_UPLOAD_MAX_MEMORY_SIZE=0)
    def test_field_count_counts_repeated_values_and_closes_parsed_files(self):
        response = self.post(extra=["a", "b"], attachments=[SimpleUploadedFile("a.txt", b"data")])
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["code"], "lead_form_fields_limit")
        self.assertFalse(Lead.objects.exists())
        self.assertFalse(LeadAttachment.objects.exists())
        self.assertEqual(list(self.root.glob("*.upload*")), [])
        self.assertEqual(self.files(), [])


    @override_settings(LEAD_RATE_LIMIT_ENABLED=False, FILE_UPLOAD_MAX_MEMORY_SIZE=0)
    def test_real_25_mib_documents_fit_body_budget(self):
        attachments = [
            SimpleUploadedFile(f"boundary-{index}.bin", b"x" * size)
            for index, size in enumerate((10 * 1024**2, 10 * 1024**2, 5 * 1024**2))
        ]
        response = self.post(attachments=attachments)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(sum(LeadAttachment.objects.values_list("size", flat=True)), 25 * 1024**2)
        self.assertEqual(list(self.root.glob("*.upload*")), [])

    @override_settings(FILE_UPLOAD_MAX_MEMORY_SIZE=0, LEAD_MAX_REQUEST_SIZE=80_000)
    def test_actual_stream_limit_closes_active_temp_file_despite_small_length_header(self):
        request = RequestFactory().post(
            "/api/leads/", {"attachments": SimpleUploadedFile("large.bin", b"x" * 100_000)}
        )
        body = request.body
        request.META["CONTENT_LENGTH"] = "1"
        stream = io.BytesIO(body)
        try:
            with self.assertRaises(LeadUploadRejected) as caught:
                LeadMultiPartParser().parse(
                    stream, request.META["CONTENT_TYPE"], {"request": request, "encoding": "utf-8"}
                )
            self.assertEqual(caught.exception.status_code, 413)
            self.assertEqual(list(self.root.glob("*.upload*")), [])
        finally:
            stream.close()
            request.close()


class LimiterProcessTests(SimpleTestCase):
    def test_atomic_shared_file_admits_exact_limit_across_processes(self):
        with tempfile.TemporaryDirectory() as directory:
            script = '''
import json
import django
from django.conf import settings
django.setup()
settings.LEAD_RATE_STORE = __import__('os').environ['TEST_LEAD_RATE_STORE']
settings.LEAD_RATE_BURST_LIMIT = 3
settings.LEAD_RATE_SUSTAINED_LIMIT = 3
from apps.leads.request_protection import consume_client, LeadRateLimited
try:
    consume_client('192.0.2.1', now=1000)
    print('admitted')
except LeadRateLimited:
    print('limited')
'''
            environment = {**os.environ, "DJANGO_SETTINGS_MODULE": "config.settings.test", "TEST_LEAD_RATE_STORE": str(Path(directory) / "limits.sqlite3")}
            processes = [subprocess.Popen(
                [sys.executable, "-c", script], env=environment, cwd=Path(__file__).resolve().parents[2],
                stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True,
            ) for _ in range(12)]
            try:
                outcomes = []
                for process in processes:
                    stdout, stderr = process.communicate(timeout=30)
                    self.assertEqual(process.returncode, 0, stderr)
                    outcomes.append(stdout.strip())
                self.assertEqual(outcomes.count("admitted"), 3)
                self.assertEqual(outcomes.count("limited"), 9)
            finally:
                for process in processes:
                    if process.poll() is None:
                        process.kill()
                        process.communicate()

    def test_actual_byte_limit_without_relying_on_header(self):
        source = io.BytesIO(b"x" * 101)
        stream = LimitedStream(source, 100)
        with self.assertRaises(LeadUploadRejected):
            stream.read()
        source.close()

    def test_ipv4_mapped_address_has_same_identity(self):
        with override_settings(LEAD_TRUSTED_PROXY_NETWORKS=[]):
            self.assertEqual(client_address({"REMOTE_ADDR": "::ffff:192.0.2.1"}), "192.0.2.1")
