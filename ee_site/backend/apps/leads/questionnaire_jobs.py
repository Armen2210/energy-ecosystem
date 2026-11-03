"""Durable bounded queue. Generating leases may be reclaimed; SMTP leases may not."""

import hashlib
import uuid
import json
import subprocess
import sys
from pathlib import Path
from datetime import timedelta
from django.conf import settings
from django.core.files.base import ContentFile
from django.db import transaction
from django.db.models import F, Q
from django.utils import timezone
from .models import Lead, LeadQuestionnaire, QuestionnaireJob
from .questionnaires import CONTRACT


def create_questionnaire_job(lead, payload):
    for item in payload["items"]:
        LeadQuestionnaire.objects.create(
            lead=lead,
            product=item["product"],
            schema_version=1,
            answers=item["answers"],
            contact_snapshot={
                k: getattr(lead, k)
                for k in ("name", "company_name", "phone", "email", "description")
            },
            definition=CONTRACT["products"][item["product"]],
        )
    QuestionnaireJob.objects.create(
        lead=lead, expected_products=sorted(i["product"] for i in payload["items"])
    )


def _valid(q):
    if not q.file or not q.sha256:
        return False
    try:
        with q.file.open("rb") as f:
            data = f.read(
                getattr(settings, "QUESTIONNAIRE_MAX_PDF_BYTES", 5 * 1024 * 1024) + 1
            )
        return len(data) == q.size and hashlib.sha256(data).hexdigest() == q.sha256
    except OSError:
        return False


def process_job(lead_id):
    from .email_notifications import _send_email

    now = timezone.now()
    max_attempts = getattr(settings, "QUESTIONNAIRE_MAX_ATTEMPTS", 3)
    # SMTP may already have accepted the email: no automatic resend on expiry.
    expired_smtp = QuestionnaireJob.objects.filter(
        lead_id=lead_id, status="sending", lease_until__lt=now
    ).update(status="uncertain", error_code="smtp_result_unknown")
    if expired_smtp:
        Lead.objects.filter(pk=lead_id).update(
            notification_status="unknown",
            notification_last_error_code="smtp_result_unknown",
        )
    eligible = Q(status__in=("pending", "retry")) & (
        Q(next_run__isnull=True) | Q(next_run__lte=now)
    ) | Q(status="generating", lease_until__lt=now)
    QuestionnaireJob.objects.filter(
        eligible, lead_id=lead_id, attempts__gte=max_attempts
    ).update(status="intervention", error_code="attempts_exhausted")
    token = uuid.uuid4()
    claimed = QuestionnaireJob.objects.filter(
        eligible, lead_id=lead_id, attempts__lt=max_attempts
    ).update(
        status="generating",
        token=token,
        lease_until=now + timedelta(minutes=5),
        attempts=F("attempts") + 1,
        error_code="",
    )
    if not claimed:
        return "skipped"

    def owned():
        return QuestionnaireJob.objects.filter(
            lead_id=lead_id,
            token=token,
            status="generating",
            lease_until__gt=timezone.now(),
        )

    try:
        expected = QuestionnaireJob.objects.get(lead_id=lead_id).expected_products
        actual = list(
            LeadQuestionnaire.objects.filter(lead_id=lead_id)
            .order_by("product")
            .values_list("product", flat=True)
        )
        if not expected or actual != expected:
            raise ValueError("questionnaire_snapshot_missing")
        for q in LeadQuestionnaire.objects.filter(lead_id=lead_id).select_related(
            "lead"
        ):
            if _valid(q):
                continue
            snapshot = {
                "product": q.product,
                "schema_version": q.schema_version,
                "generator_version": q.generator_version,
                "answers": q.answers,
                "definition": q.definition,
                "lead": {
                    "pk": q.lead_id,
                    "created_at": q.lead.created_at.isoformat(),
                    **q.contact_snapshot,
                },
            }
            run = subprocess.run(
                [sys.executable, "-m", "apps.leads.pdf_process"],
                input=json.dumps(snapshot, ensure_ascii=False).encode(),
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                cwd=Path(__file__).resolve().parents[2],
                timeout=getattr(settings, "QUESTIONNAIRE_PDF_TIMEOUT", 45),
                check=True,
            )
            data = run.stdout
            if not data.startswith(b"%PDF-") or len(data) > getattr(
                settings, "QUESTIONNAIRE_MAX_PDF_BYTES", 5 * 1024 * 1024
            ):
                raise ValueError("pdf_limit")
            # New filename per lease; a stale worker never replaces a newer file.
            name = f"{lead_id}-{q.product}-{token}.pdf"
            stored = q.file.storage.save(
                "leads/questionnaires/" + name, ContentFile(data)
            )
            try:
                with transaction.atomic():
                    job = QuestionnaireJob.objects.select_for_update().get(
                        lead_id=lead_id
                    )
                    if (
                        job.token != token
                        or job.status != "generating"
                        or job.lease_until <= timezone.now()
                    ):
                        q.file.storage.delete(stored)
                        return "lost_claim"
                    old = q.file.name
                    LeadQuestionnaire.objects.filter(pk=q.pk).update(
                        file=stored,
                        size=len(data),
                        sha256=hashlib.sha256(data).hexdigest(),
                    )
                if old and old != stored:
                    q.file.storage.delete(old)
            except Exception:
                # Referenced file is retained even if cleanup/DB result is unknown.
                if not LeadQuestionnaire.objects.filter(file=stored).exists():
                    q.file.storage.delete(stored)
                raise
        if not all(
            _valid(q) for q in LeadQuestionnaire.objects.filter(lead_id=lead_id)
        ):
            raise OSError("pdf_integrity")
        if not owned().update(
            status="sending", lease_until=timezone.now() + timedelta(minutes=5)
        ):
            return "lost_claim"
        Lead.objects.filter(pk=lead_id).update(
            notification_status="sending",
            notification_attempts=F("notification_attempts") + 1,
            notification_last_attempt_at=timezone.now(),
        )
        sent, code = _send_email(Lead.objects.get(pk=lead_id))
        # Any failure during SMTP is conservatively uncertain; staff must inspect.
        status = (
            "done"
            if sent
            else (
                "uncertain"
                if code in ("email_backend_failed", "email_backend_sent_zero")
                else "retry"
            )
        )
        with transaction.atomic():
            job = QuestionnaireJob.objects.select_for_update().get(lead_id=lead_id)
            if job.token != token or job.status != "sending":
                return "lost_claim"
            job.status = status
            job.error_code = code
            job.next_run = timezone.now() + timedelta(minutes=2)
            job.save()
            Lead.objects.filter(pk=lead_id).update(
                notification_status=(
                    "sent" if sent else "unknown" if status == "uncertain" else "failed"
                ),
                notification_sent_at=timezone.now() if sent else None,
                notification_last_error_code=code,
            )
        return status
    except Exception as exc:
        # Never journal answers, contacts, file contents or exception messages.
        import logging

        logging.getLogger(__name__).error(
            "Questionnaire job lead_id=%s code=processing_failed exception_type=%s",
            lead_id,
            type(exc).__name__,
        )
        updated = owned().update(
            status="retry",
            next_run=timezone.now() + timedelta(minutes=2),
            error_code="generation_failed",
        )
        if updated:
            Lead.objects.filter(pk=lead_id).update(
                notification_status="failed",
                notification_last_error_code="generation_failed",
            )
        # If phase was sending, leave it for expiry -> uncertain.
        return "failed"
