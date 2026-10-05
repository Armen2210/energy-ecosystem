import math
from datetime import timedelta

from django.core.management.base import BaseCommand, CommandError
from django.db.models import Min
from django.utils import timezone

from apps.leads.models import Lead


class Command(BaseCommand):
    help = "Show read-only lead notification queue diagnostics."

    def add_arguments(self, parser):
        parser.add_argument("--sending-older-than", type=float, default=30.0)

    def handle(self, *args, **options):
        minutes = options["sending_older_than"]
        if not math.isfinite(minutes) or minutes <= 0:
            raise CommandError(
                "--sending-older-than must be positive finite minutes."
            )
        counts = {
            status: Lead.objects.filter(notification_status=status).count()
            for status in (
                Lead.NotificationStatus.PENDING,
                Lead.NotificationStatus.SENDING,
                Lead.NotificationStatus.FAILED,
            )
        }
        oldest = Lead.objects.filter(
            notification_status=Lead.NotificationStatus.PENDING
        ).aggregate(value=Min("created_at"))["value"]
        stale = Lead.objects.filter(
            notification_status=Lead.NotificationStatus.SENDING,
            notification_last_attempt_at__lt=timezone.now() - timedelta(minutes=minutes),
        ).count()
        age = "none" if oldest is None else str(timezone.now() - oldest)
        self.stdout.write(
            f"pending={counts['pending']} sending={counts['sending']} "
            f"failed={counts['failed']} oldest_pending_age={age} "
            f"sending_older_than_{minutes:g}m={stale}"
        )
