import time
from django.core.management.base import BaseCommand
from apps.leads.models import LeadQuestionnaire, private_lead_attachment_storage
from apps.leads.questionnaire_jobs import _valid


class Command(BaseCommand):
    help = "Audit questionnaire integrity and orphan files; --apply removes only unreferenced files older than 24h."

    def add_arguments(self, parser):
        parser.add_argument("--apply", action="store_true")

    def handle(self, *args, **options):
        for q in LeadQuestionnaire.objects.exclude(file="").iterator():
            if not _valid(q):
                self.stdout.write(
                    f"lead_id={q.lead_id} questionnaire_id={q.pk} code=pdf_integrity_failed"
                )
        storage = private_lead_attachment_storage()
        try:
            _, names = storage.listdir("leads/questionnaires")
        except FileNotFoundError:
            return
        for name in names:
            key = "leads/questionnaires/" + name
            if LeadQuestionnaire.objects.filter(file=key).exists():
                continue
            if time.time() - storage.get_modified_time(key).timestamp() < 86400:
                continue
            self.stdout.write(
                "code=orphan_questionnaire_pdf action="
                + ("delete" if options["apply"] else "dry_run")
            )
            if options["apply"]:
                storage.delete(key)
