import tempfile
from pathlib import Path
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import connection
from django.db.migrations.executor import MigrationExecutor
from apps.leads.models import LeadQuestionnaire, QuestionnaireJob


class Command(BaseCommand):
    help = "Read-only DB/config preflight plus a temporary private-storage write; does not send mail."

    def handle(self, *args, **options):
        executor = MigrationExecutor(connection)
        if executor.migration_plan(executor.loader.graph.leaf_nodes()):
            raise CommandError("Pending migrations.")
        if not Path(settings.QUESTIONNAIRE_FONT_PATH).is_file():
            raise CommandError("Install DejaVu Sans font.")
        import reportlab

        root = Path(settings.LEAD_PRIVATE_ATTACHMENT_ROOT)
        root.mkdir(parents=True, exist_ok=True)
        with tempfile.TemporaryFile(dir=root) as test:
            test.write(b"private-storage-preflight")
            test.flush()
        QuestionnaireJob.objects.exists()
        LeadQuestionnaire.objects.exists()
        self.stdout.write(
            "Questionnaire DB/schema/font/private storage: ready. Confirm supervised worker separately. No SMTP sent."
        )
