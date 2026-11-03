"""Bounded child renderer; trusted saved snapshots only, never user URLs/paths."""

import json
import os
import resource
import sys
from datetime import datetime
from types import SimpleNamespace

if __name__ == "__main__":
    resource.setrlimit(resource.RLIMIT_CPU, (30, 30))
    resource.setrlimit(resource.RLIMIT_AS, (512 * 1024 * 1024, 512 * 1024 * 1024))
    resource.setrlimit(resource.RLIMIT_FSIZE, (6 * 1024 * 1024, 6 * 1024 * 1024))
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.test")
    import django

    django.setup()
    from .questionnaire_pdf import render_pdf

    data = json.load(sys.stdin)
    lead = SimpleNamespace(**data.pop("lead"))
    lead.created_at = datetime.fromisoformat(lead.created_at)
    sys.stdout.buffer.write(render_pdf(SimpleNamespace(**data, lead=lead)))
