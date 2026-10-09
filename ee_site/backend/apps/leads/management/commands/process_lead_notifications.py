import math
import signal
import time

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import DatabaseError, close_old_connections

from apps.leads.email_notifications import (
    NotificationAttemptResult,
    NotificationErrorCode,
    send_lead_notification,
)
from apps.leads.models import Lead


class Command(BaseCommand):
    help = "Process the durable pending lead-notification queue."

    def add_arguments(self, parser):
        parser.add_argument("--limit", type=int, default=20)
        parser.add_argument("--continuous", action="store_true")
        parser.add_argument("--interval", type=float, default=5.0)

    def handle(self, *args, **options):
        if settings.LEAD_NOTIFICATION_MODE != "background":
            raise CommandError(
                "Lead notification worker requires LEAD_NOTIFICATION_MODE=background; "
                "refusing to mix synchronous and worker delivery."
            )
        if options["limit"] <= 0:
            raise CommandError("--limit must be a positive integer.")
        if not math.isfinite(options["interval"]) or options["interval"] <= 0:
            raise CommandError("--interval must be a positive finite number.")

        stopping = False

        def request_stop(signum, frame):
            nonlocal stopping
            stopping = True

        old_handlers = {}
        for name in ("SIGINT", "SIGTERM"):
            sig = getattr(signal, name, None)
            if sig is not None:
                try:
                    old_handlers[sig] = signal.signal(sig, request_stop)
                except (OSError, ValueError):
                    pass  # Unsupported or not running in the main thread.
        try:
            while not stopping:
                close_old_connections()
                cycle_failed = False
                try:
                    ids = list(
                        Lead.objects.filter(
                            notification_status=Lead.NotificationStatus.PENDING
                        )
                        .order_by("created_at", "pk")
                        .values_list("pk", flat=True)[: options["limit"]]
                    )
                    for lead_id in ids:
                        if stopping:
                            break
                        try:
                            result = send_lead_notification(lead_id)
                        except DatabaseError as exc:
                            self._log_error(
                                lead_id, "process", "database_error", exc
                            )
                            cycle_failed = True
                            break
                        except Exception as exc:
                            self._log_error(
                                lead_id, "process", "unexpected_record_error", exc
                            )
                            continue
                        finally:
                            close_old_connections()

                        if (
                            result.outcome == NotificationAttemptResult.FAILED
                            and result.error_code
                            in {
                                NotificationErrorCode.STATE_CLAIM_FAILED,
                                NotificationErrorCode.STATE_READ_FAILED,
                                NotificationErrorCode.STATE_RESULT_FAILED,
                            }
                        ):
                            self._log_error(
                                lead_id,
                                "process_result",
                                result.error_code,
                            )
                            cycle_failed = True
                            break
                except DatabaseError as exc:
                    self._log_error(None, "select_batch", "database_error", exc)
                    cycle_failed = True
                except Exception as exc:
                    self.stderr.write(
                        "Queue cycle failed "
                        "stage=select_batch code=queue_cycle_failed "
                        f"lead_id=none exception_type={type(exc).__name__}"
                    )
                    cycle_failed = True

                close_old_connections()
                if cycle_failed and not options["continuous"]:
                    raise CommandError("Lead notification queue cycle failed.")

                if not options["continuous"] or stopping:
                    break
                time.sleep(options["interval"])
        except KeyboardInterrupt:
            pass
        finally:
            close_old_connections()
            for sig, handler in old_handlers.items():
                signal.signal(sig, handler)

    def _log_error(self, lead_id, stage, code, exc=None):
        exception_type = type(exc).__name__ if exc is not None else "none"
        safe_lead_id = lead_id if lead_id is not None else "none"
        self.stderr.write(
            f"Worker error lead_id={safe_lead_id} stage={stage} code={code} "
            f"exception_type={exception_type}"
        )
