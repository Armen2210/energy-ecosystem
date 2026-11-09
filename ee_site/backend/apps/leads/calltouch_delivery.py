"""Durable Calltouch delivery, separate from operational email and questionnaires."""

import json
import re
from urllib.parse import urlencode
from urllib.request import HTTPRedirectHandler, Request, build_opener

from django.conf import settings
from django.utils import timezone

from .models import CalltouchDelivery

from .attribution import PRODUCTS, SERVICES

DIRECTIONS = set(PRODUCTS) | set(SERVICES)
SITE = "https://www.energoeffekt-rostov.ru"


def configured_site():
    site = str(settings.CALLTOUCH_SITE_ID)
    if settings.CALLTOUCH_DELIVERY_ENABLED and re.fullmatch(r"[1-9][0-9]{0,15}", site):
        return site
    return None


def enqueue(lead, tracking=None):
    """Record first-write metadata only; never backfill historical leads."""
    site = configured_site()
    if not site or not isinstance(tracking, dict) or tracking.get("enabled") is not True:
        return
    session_id = tracking.get("session_id", "")
    if not isinstance(session_id, str) or (session_id and not re.fullmatch(r"[1-9][0-9]{0,19}", session_id)):
        return
    CalltouchDelivery.objects.create(lead=lead, site_id=site, session_id=session_id)


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None


def send(job):
    lead = job.lead
    phone = re.sub(r"[^0-9]", "", lead.phone)
    if len(phone) == 11 and phone.startswith("8"):
        phone = "7" + phone[1:]
    slug = lead.direction_slug
    # Only send known paths; discard URL query strings and fragments.
    path = lead.source_page.split("?", 1)[0].split("#", 1)[0]
    payload = {
        "fio": lead.name,
        "requestNumber": f"ee-{lead.pk}",
        "subject": "Заявка с сайта Энергоэффект",
        "tags": slug.upper() if slug in DIRECTIONS else "Общая заявка",
    }
    if len(phone) == 11:
        payload["phoneNumber"] = phone
    if lead.email:
        payload["email"] = lead.email
    if path in {"/", "/about", "/contacts", "/solutions", "/services", "/documents", "/cases",
                *(f"/solutions/{p}" for p in PRODUCTS), *(f"/services/{p}" for p in SERVICES)}:
        payload["requestUrl"] = SITE + path
    if job.session_id:
        payload["sessionId"] = job.session_id
    request = Request(
        f"https://api.calltouch.ru/calls-service/RestAPI/requests/{job.site_id}/register/",
        data=urlencode(payload).encode("ascii"),
        headers={"Content-Type": "application/x-www-form-urlencoded; charset=utf-8"},
    )
    with build_opener(NoRedirect()).open(request, timeout=5) as response:
        result = json.loads(response.read(65536))
    request_id = result.get("requestId") if isinstance(result, dict) else None
    if (type(request_id) is not int or not 0 < request_id < 2**63
            or result.get("requestNumber") != f"ee-{lead.pk}"):
        raise ValueError("unconfirmed_registration")
    return request_id


def deliver(job, *, transport=send):
    if job.site_id != configured_site():
        return False
    # Claim before network I/O. Never reclaim a stale SENDING automatically:
    # a worker can die after Calltouch creates a record but before we persist it.
    if not CalltouchDelivery.objects.filter(pk=job.pk, state=CalltouchDelivery.State.PENDING).update(
        state=CalltouchDelivery.State.SENDING, updated_at=timezone.now(),
    ):
        return False
    try:
        request_id = transport(job)
    except Exception:
        CalltouchDelivery.objects.filter(pk=job.pk).update(
            state=CalltouchDelivery.State.UNCERTAIN, updated_at=timezone.now(),
        )
    else:
        CalltouchDelivery.objects.filter(pk=job.pk).update(
            state=CalltouchDelivery.State.SENT, request_id=request_id, updated_at=timezone.now(),
        )
    return True
