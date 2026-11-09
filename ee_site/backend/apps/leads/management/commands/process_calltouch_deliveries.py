from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from ...calltouch_delivery import configured_site, deliver
from ...models import CalltouchDelivery


class Command(BaseCommand):
    help = "Process up to 20 pending exports; ambiguous outcomes require journal reconciliation."

    def add_arguments(self, parser):
        parser.add_argument("--status", action="store_true", help="Show queue counts without sending.")
        parser.add_argument("--requeue-checked", type=int, metavar="LEAD_ID",
                            help="Requeue UNCERTAIN only after checking absence in Calltouch journal.")

    def handle(self, *args, **options):
        if options["status"]:
            for state in CalltouchDelivery.State.values:
                self.stdout.write(f"{state}: {CalltouchDelivery.objects.filter(state=state).count()}")
            return
        site = configured_site()
        if site is None:
            self.stdout.write("Calltouch delivery disabled.")
            return
        if options["requeue_checked"] is not None:
            changed = CalltouchDelivery.objects.filter(
                lead_id=options["requeue_checked"], site_id=site,
                state=CalltouchDelivery.State.UNCERTAIN,
            ).update(state=CalltouchDelivery.State.PENDING, updated_at=timezone.now())
            if not changed:
                raise CommandError("No uncertain delivery for this lead/project. SENDING is never reclaimed automatically.")
            self.stdout.write("Checked delivery requeued. Run the worker separately.")
            return
        jobs = CalltouchDelivery.objects.select_related("lead").filter(
            state=CalltouchDelivery.State.PENDING, site_id=site,
        ).order_by("pk")[:20]
        self.stdout.write(f"Claimed deliveries: {sum(deliver(job) for job in jobs)}")
