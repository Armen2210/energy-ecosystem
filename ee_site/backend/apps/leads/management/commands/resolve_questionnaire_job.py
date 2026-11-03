from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone
from apps.leads.models import QuestionnaireJob, Lead


class Command(BaseCommand):
    help = "Resolve an uncertain SMTP result only after operator investigation; inspection does not change rows but takes a transaction row lock."

    def add_arguments(self, parser):
        parser.add_argument("--lead", type=int, required=True)
        parser.add_argument("--decision", choices=("sent", "retry"))
        parser.add_argument("--acknowledge-smtp-duplicate-risk", action="store_true")

    def handle(self, *args, **options):
        with transaction.atomic():
            job = QuestionnaireJob.objects.select_for_update().get(
                lead_id=options["lead"]
            )
            if not options["decision"]:
                self.stdout.write(
                    f"lead_id={job.lead_id} status={job.status} attempts={job.attempts} code={job.error_code}"
                )
                return
            if job.status != "uncertain":
                raise CommandError("Only uncertain jobs may be resolved.")
            if not options["acknowledge_smtp_duplicate_risk"]:
                raise CommandError(
                    "Explicit acknowledgement required after inspecting SMTP logs."
                )
            sent = options["decision"] == "sent"
            job.status = "done" if sent else "pending"
            job.next_run = None
            job.token = None
            job.lease_until = None
            job.error_code = ""
            job.attempts = 0
            job.save()
            Lead.objects.filter(pk=job.lead_id).update(
                notification_status="sent" if sent else "pending",
                notification_sent_at=timezone.now() if sent else None,
                notification_last_error_code="",
            )
            self.stdout.write(f'lead_id={job.lead_id} resolution={options["decision"]}')
