import ipaddress
from pathlib import Path

from django.conf import settings
from django.core.checks import Error, register


@register()
def check_private_attachment_root(app_configs, **kwargs):
    media_root = Path(settings.MEDIA_ROOT).expanduser().resolve(strict=False)
    private_root = (
        Path(settings.LEAD_PRIVATE_ATTACHMENT_ROOT)
        .expanduser()
        .resolve(strict=False)
    )
    if private_root == media_root or media_root in private_root.parents:
        return [
            Error(
                "LEAD_PRIVATE_ATTACHMENT_ROOT must be outside MEDIA_ROOT.",
                id="leads.E001",
            )
        ]
    return []


@register()
def check_lead_proxy_networks(app_configs, **kwargs):
    errors = []
    for value in settings.LEAD_TRUSTED_PROXY_NETWORKS:
        try:
            network = ipaddress.ip_network(value)
            if network.prefixlen == 0:
                raise ValueError
        except ValueError:
            errors.append(Error(
                "LEAD_TRUSTED_PROXY_NETWORKS must contain explicit trusted CIDRs, not all clients.",
                id="leads.E002",
            ))
    return errors
