"""Atomic, single-host admission control; no application DB/cache dependency."""
import hashlib
import ipaddress
import json
import logging
import math
import sqlite3
import time
from pathlib import Path

from django.conf import settings
from rest_framework.exceptions import APIException

logger = logging.getLogger(__name__)


class ProtectionUnavailable(APIException):
    status_code = 503
    default_detail = {
        "detail": "Приём заявок временно недоступен. Попробуйте позже.",
        "code": "lead_protection_unavailable",
    }


class LeadRateLimited(APIException):
    status_code = 429

    def __init__(self, wait):
        self.wait = wait
        # Keep the machine code and numeric delay intact (APIException normally
        # coerces every leaf to an ErrorDetail string).
        self.detail = {
            "detail": "Слишком много запросов. Подождите перед повторной отправкой.",
            "code": "lead_rate_limited",
            "retry_after": wait,
        }


def _address(value):
    address = ipaddress.ip_address(value)
    if isinstance(address, ipaddress.IPv6Address) and address.ipv4_mapped:
        return address.ipv4_mapped
    return address


def client_address(meta):
    try:
        raw_peer = meta.get("REMOTE_ADDR", "")
        if not raw_peer and settings.LEAD_TRUST_UNIX_SOCKET_PROXY:
            # Gunicorn on a Unix socket has no IP peer. This opt-in is valid
            # only when socket permissions restrict access to trusted nginx.
            return str(_address(meta.get("HTTP_X_REAL_IP", "")))
        peer = _address(raw_peer)
        trusted = any(
            peer in ipaddress.ip_network(network)
            for network in settings.LEAD_TRUSTED_PROXY_NETWORKS
        )
        # Only a trusted peer may supply the single, overwritten nginx header.
        # Missing/invalid headers fail closed rather than grouping all visitors
        # under the reverse proxy address. X-Forwarded-For is never consulted.
        if trusted:
            return str(_address(meta.get("HTTP_X_REAL_IP", "")))
        return str(peer)
    except ValueError:
        raise ProtectionUnavailable() from None


def consume_client(address, now=None):
    """Reserve one attempt in both sliding windows in one SQLite transaction.

    All web workers must use the same local file. SQLite serializes writers;
    failure/lock timeout is a 503, never an unprotected admission. Not a
    distributed limiter and not suitable for NFS/shared multi-host storage.
    """
    windows = (
        (settings.LEAD_RATE_BURST_LIMIT, settings.LEAD_RATE_BURST_SECONDS),
        (settings.LEAD_RATE_SUSTAINED_LIMIT, settings.LEAD_RATE_SUSTAINED_SECONDS),
    )
    horizon = max(period for _, period in windows)
    key = hashlib.sha256(address.encode("ascii")).hexdigest()
    path = Path(settings.LEAD_RATE_STORE)
    connection = None
    try:
        # Parent directory must be provisioned by the operator. sqlite3 creates
        # the file with the process umask; use a private application directory.
        connection = sqlite3.connect(path, timeout=1, isolation_level=None)
        connection.execute("BEGIN IMMEDIATE")
        # Timestamp after the writer lock: queued workers must check the window
        # at reservation time, not against an earlier snapshot.
        now = time.time() if now is None else now
        connection.execute(
            "CREATE TABLE IF NOT EXISTS lead_limits "
            "(client TEXT PRIMARY KEY, history TEXT NOT NULL, expires REAL NOT NULL)"
        )
        connection.execute(
            "CREATE INDEX IF NOT EXISTS lead_limits_expiry ON lead_limits(expires)"
        )
        connection.execute("DELETE FROM lead_limits WHERE expires <= ?", (now,))
        row = connection.execute(
            "SELECT history FROM lead_limits WHERE client = ?", (key,)
        ).fetchone()
        history = (
            [stamp for stamp in json.loads(row[0]) if stamp > now - horizon]
            if row else []
        )
        waits = []
        for limit, period in windows:
            active = sorted(stamp for stamp in history if stamp > now - period)
            if len(active) >= limit:
                waits.append(active[-limit] + period - now)
        if waits:
            connection.commit()
            raise LeadRateLimited(max(1, math.ceil(max(waits))))
        history.append(now)
        connection.execute(
            "INSERT INTO lead_limits VALUES (?, ?, ?) "
            "ON CONFLICT(client) DO UPDATE SET history=excluded.history, expires=excluded.expires",
            (key, json.dumps(history), now + horizon),
        )
        connection.commit()
    except (sqlite3.Error, OSError, ValueError, TypeError):
        logger.error("Lead admission failed code=lead_protection_unavailable")
        raise ProtectionUnavailable() from None
    finally:
        if connection is not None:
            connection.close()
