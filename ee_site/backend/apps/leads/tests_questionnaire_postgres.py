import json
import uuid
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from threading import Barrier
from unittest import skipUnless
from django.db import connection, close_old_connections
from django.test import TransactionTestCase, override_settings
from .lead_creation import create_lead
from .questionnaires import validate_payload
from .models import Lead, QuestionnaireJob
from .questionnaire_jobs import process_job


@skipUnless(
    connection.vendor == "postgresql", "Requires PostgreSQL concurrency semantics"
)
@override_settings(
    LEAD_NOTIFICATION_EMAIL="manager@example.invalid",
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
)
class QuestionnairePostgresTests(TransactionTestCase):
    def test_parallel_submission_and_claim(self):
        import tempfile

        payload = validate_payload(
            (
                Path(__file__).resolve().parents[4]
                / "contracts/questionnaires/v1/examples/pumps.json"
            ).read_text()
        )
        submission = uuid.uuid4()
        barrier = Barrier(2)

        def create():
            close_old_connections()
            barrier.wait()
            try:
                lead, created = create_lead(
                    {
                        "name": "Concurrency",
                        "phone": "000",
                        "submission_id": submission,
                        "questionnaires": payload,
                    }
                )
                return lead.pk, created
            finally:
                close_old_connections()

        with ThreadPoolExecutor(max_workers=2) as pool:
            results = list(pool.map(lambda _: create(), range(2)))
        self.assertEqual(len({r[0] for r in results}), 1)
        self.assertEqual(sum(r[1] for r in results), 1)
        self.assertEqual(Lead.objects.count(), 1)
        with tempfile.TemporaryDirectory() as tmp, override_settings(
            LEAD_PRIVATE_ATTACHMENT_ROOT=tmp
        ):
            barrier = Barrier(2)

            def work():
                close_old_connections()
                barrier.wait()
                try:
                    return process_job(results[0][0])
                finally:
                    close_old_connections()

            with ThreadPoolExecutor(max_workers=2) as pool:
                outcomes = list(pool.map(lambda _: work(), range(2)))
            self.assertEqual(sorted(outcomes), ["done", "skipped"])
            self.assertEqual(QuestionnaireJob.objects.get().attempts, 1)
