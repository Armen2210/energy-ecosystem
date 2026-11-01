import time
from django.core.management.base import BaseCommand, CommandError
from django.db import close_old_connections
from django.db.models import Q
from django.utils import timezone
from apps.leads.models import QuestionnaireJob
from apps.leads.questionnaire_jobs import process_job


class Command(BaseCommand):
    help = "Process durable questionnaire jobs; one job at a time, bounded batch."

    def add_arguments(self, parser):
        parser.add_argument("--limit", type=int, default=10)
        parser.add_argument("--continuous", action="store_true")
        parser.add_argument("--interval", type=int, default=5)

    def handle(self, *args, **options):
        if not 1 <= options["limit"] <= 100 or not 1 <= options["interval"] <= 60:
            raise CommandError("Invalid batch/interval.")
        try:
            while True:
                now = timezone.now()
                due = (
                    Q(status__in=("pending", "retry"))
                    & (Q(next_run__isnull=True) | Q(next_run__lte=now))
                ) | Q(status__in=("generating", "sending"), lease_until__lt=now)
                ids = list(
                    QuestionnaireJob.objects.filter(due)
                    .order_by("id")
                    .values_list("lead_id", flat=True)[: options["limit"]]
                )
                for pk in ids:
                    self.stdout.write(f"lead_id={pk} outcome={process_job(pk)}")
                    close_old_connections()
                if not options["continuous"]:
                    break
                time.sleep(options["interval"])
        except KeyboardInterrupt:
            pass
