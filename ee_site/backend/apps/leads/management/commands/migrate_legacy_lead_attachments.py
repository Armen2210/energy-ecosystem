import hashlib
import os
import uuid
from contextlib import contextmanager
from pathlib import Path

from django.conf import settings
from django.core.files.base import File
from django.core.management.base import BaseCommand, CommandError
from django.db import connection, transaction

from apps.leads.models import Lead, LeadAttachment


LOCK_ID = 0x45454C41  # Stable PostgreSQL advisory-lock key ("EELA").
CHUNK_SIZE = 1024 * 1024


class SourceChanged(Exception):
    pass


class HashingFile(File):
    """A storage input which records exactly the bytes consumed by save()."""

    def __init__(self, file_object):
        super().__init__(file_object)
        self.digest = hashlib.sha256()
        self.byte_count = 0

    def chunks(self, chunk_size=CHUNK_SIZE):
        for chunk in super().chunks(chunk_size):
            self.digest.update(chunk)
            self.byte_count += len(chunk)
            yield chunk


def hash_stored_file(storage, name):
    digest = hashlib.sha256()
    size = 0
    with storage.open(name, "rb") as document:
        while True:
            chunk = document.read(CHUNK_SIZE)
            if not chunk:
                break
            digest.update(chunk)
            size += len(chunk)
    return size, digest.hexdigest()


@contextmanager
def migration_lock(apply):
    """Serialize apply runs; PostgreSQL locking also works across application hosts."""
    if not apply:
        yield
        return
    if connection.vendor == "postgresql":
        with connection.cursor() as cursor:
            cursor.execute("SELECT pg_try_advisory_lock(%s)", [LOCK_ID])
            acquired = cursor.fetchone()[0]
        if not acquired:
            raise CommandError("Another attachment migration is already running.")
        try:
            yield
        finally:
            with connection.cursor() as cursor:
                cursor.execute("SELECT pg_advisory_unlock(%s)", [LOCK_ID])
        return

    try:
        import fcntl
    except ImportError as exc:
        raise CommandError(
            "Apply on this non-PostgreSQL platform is unsupported: "
            "an inter-process file lock is unavailable."
        ) from exc

    lock_path = Path(settings.LEAD_PRIVATE_ATTACHMENT_ROOT).parent / ".lead-migration.lock"
    lock_path.parent.mkdir(parents=True, exist_ok=True)
    with lock_path.open("a+") as lock_file:
        try:
            fcntl.flock(lock_file, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError as exc:
            raise CommandError("Another attachment migration is already running.") from exc
        yield


class Command(BaseCommand):
    help = "Verify and copy historical Lead.attachment files to private storage."

    def add_arguments(self, parser):
        parser.add_argument(
            "--apply",
            action="store_true",
            help="Write verified copies and mapping rows (default is read-only).",
        )
        parser.add_argument(
            "--after-id",
            type=int,
            default=0,
            help="Process Lead IDs greater than this cursor.",
        )
        parser.add_argument(
            "--verify",
            action="store_true",
            help="Verify existing legacy mappings instead of migrating missing ones.",
        )
        parser.add_argument(
            "--lead-id",
            action="append",
            type=int,
            dest="lead_ids",
            help="Process only this Lead ID; repeat to select several IDs.",
        )
        parser.add_argument(
            "--limit",
            type=int,
            default=100,
            help="Maximum number of selected leads to inspect (default: 100).",
        )

    def handle(self, *args, **options):
        apply = options["apply"]
        limit = options["limit"]
        if options["verify"] and apply:
            raise CommandError("--verify is read-only and cannot be combined with --apply.")
        if limit <= 0:
            raise CommandError("--limit must be a positive integer.")
        if options["after_id"] < 0:
            raise CommandError("--after-id cannot be negative.")

        verify = options["verify"]
        if verify:
            queryset = LeadAttachment.objects.filter(
                legacy_source__isnull=False,
                legacy_source_id__gt=options["after_id"],
            ).select_related("legacy_source")
            if options["lead_ids"]:
                queryset = queryset.filter(legacy_source_id__in=set(options["lead_ids"]))
            items = list(queryset.order_by("legacy_source_id")[:limit])
        else:
            queryset = (
                Lead.objects.exclude(attachment="")
                .exclude(attachment__isnull=True)
                .filter(
                    pk__gt=options["after_id"],
                    legacy_attachment_copy__isnull=True,
                )
            )
            if options["lead_ids"]:
                queryset = queryset.filter(pk__in=set(options["lead_ids"]))
            items = list(queryset.order_by("pk")[:limit])
        counts = {
            "checked": 0,
            "migrated": 0,
            "verified": 0,
            "skipped": 0,
            "problems": 0,
        }

        self.stdout.write("Mode: APPLY" if apply else "Mode: DRY-RUN (no writes)")
        try:
            with migration_lock(apply):
                for item in items:
                    counts["checked"] += 1
                    if verify:
                        self._verify(item, counts)
                    else:
                        self._process(item, apply, counts)
        finally:
            self.stdout.write(
                "Summary: checked={checked} migrated={migrated} "
                "verified={verified} skipped={skipped} problems={problems}".format(**counts)
            )

        if counts["problems"]:
            raise CommandError("One or more historical attachments remain incomplete.")

    def _process(self, lead, apply, counts):
        source_name = lead.attachment.name
        source_storage = lead.attachment.storage
        try:
            source_size, source_hash = hash_stored_file(source_storage, source_name)
        except Exception as exc:
            self._problem(lead.pk, "source_unavailable", exc, counts)
            return

        if not apply:
            counts["skipped"] += 1
            self.stdout.write(f"lead_id={lead.pk} result=would_migrate")
            return

        destination_storage = LeadAttachment._meta.get_field("file").storage
        destination_name = ""
        try:
            with source_storage.open(source_name, "rb") as source:
                hashing_source = HashingFile(source)
                requested_name = (
                    f"leads/attachments/legacy-{lead.pk}-{uuid.uuid4().hex}.bin"
                )
                destination_name = destination_storage.save(requested_name, hashing_source)

            copied_size, copied_hash = hash_stored_file(
                destination_storage, destination_name
            )
            if (
                hashing_source.byte_count != source_size
                or hashing_source.digest.hexdigest() != source_hash
                or copied_size != source_size
                or copied_hash != source_hash
            ):
                raise SourceChanged("source or saved copy digest mismatch")

            with transaction.atomic():
                current = Lead.objects.select_for_update().get(pk=lead.pk)
                if current.attachment.name != source_name:
                    raise SourceChanged("legacy field changed")
                if LeadAttachment.objects.filter(legacy_source_id=lead.pk).exists():
                    raise SourceChanged("mapping appeared concurrently")
                LeadAttachment.objects.create(
                    lead=current,
                    legacy_source=current,
                    file=destination_name,
                    original_name=os.path.basename(source_name),
                    size=copied_size,
                    sha256=copied_hash,
                )
        except BaseException as exc:
            if destination_name:
                try:
                    referenced = LeadAttachment.objects.filter(file=destination_name).exists()
                except Exception as cleanup_exc:
                    self.stderr.write(
                        f"lead_id={lead.pk} result=problem "
                        "reason=cleanup_reference_check_failed "
                        f"exception_type={type(cleanup_exc).__name__}"
                    )
                else:
                    try:
                        if not referenced:
                            destination_storage.delete(destination_name)
                    except Exception as cleanup_exc:
                        self.stderr.write(
                            f"lead_id={lead.pk} result=problem "
                            "reason=cleanup_delete_failed "
                            f"exception_type={type(cleanup_exc).__name__}"
                        )
            if not isinstance(exc, Exception):
                raise
            self._problem(lead.pk, "copy_or_commit_failed", exc, counts)
            return

        counts["migrated"] += 1
        self.stdout.write(f"lead_id={lead.pk} result=migrated")

    def _verify(self, mapping, counts):
        valid = True
        lead = mapping.legacy_source

        source_ok = False
        try:
            source_size, source_hash = hash_stored_file(
                lead.attachment.storage, lead.attachment.name
            )
            source_ok = source_size == mapping.size and source_hash == mapping.sha256
            if not source_ok:
                self._write_problem(lead.pk, "source_changed", SourceChanged())
                valid = False
        except Exception as exc:
            self._write_problem(lead.pk, "source_unavailable", exc)
            valid = False

        if mapping.lead_id != lead.pk:
            self._write_problem(lead.pk, "mapping_lead_mismatch", SourceChanged())
            valid = False
        try:
            private_size, private_hash = hash_stored_file(
                mapping.file.storage, mapping.file.name
            )
        except Exception as exc:
            self._write_problem(lead.pk, "private_copy_unavailable", exc)
            counts["problems"] += 1
            return
        if (
            not mapping.sha256
            or private_size != mapping.size
            or private_hash != mapping.sha256
        ):
            self._write_problem(lead.pk, "private_copy_mismatch", SourceChanged())
            counts["problems"] += 1
            return
        if not valid:
            counts["problems"] += 1
            return
        counts["verified"] += 1
        self.stdout.write(f"lead_id={lead.pk} result=verified")

    def _problem(self, lead_id, reason, exc, counts):
        counts["problems"] += 1
        self._write_problem(lead_id, reason, exc)

    def _write_problem(self, lead_id, reason, exc):
        self.stderr.write(
            f"lead_id={lead_id} result=problem reason={reason} "
            f"exception_type={type(exc).__name__}"
        )
