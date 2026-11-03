import ipaddress
from pathlib import Path

from django.conf import settings
from django.core.checks import Error, register


@register()
def check_private_attachment_root(app_configs, **kwargs):
    media_root = Path(settings.MEDIA_ROOT).expanduser().resolve(strict=False)
    private_root = (
        Path(settings.LEAD_PRIVATE_ATTACHMENT_ROOT).expanduser().resolve(strict=False)
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
            errors.append(
                Error(
                    "LEAD_TRUSTED_PROXY_NETWORKS must contain explicit trusted CIDRs, not all clients.",
                    id="leads.E002",
                )
            )
    return errors


@register()
def check_questionnaire_configuration(app_configs, **kwargs):
    if not getattr(settings, "QUESTIONNAIRES_ENABLED", False):
        return []
    errors = []
    for name in (
        "QUESTIONNAIRE_MAX_BYTES",
        "QUESTIONNAIRE_MAX_ITEMS",
        "QUESTIONNAIRE_MAX_OUTLETS",
        "QUESTIONNAIRE_MAX_TEXT",
        "QUESTIONNAIRE_MAX_PDF_BYTES",
        "QUESTIONNAIRE_MAX_ATTEMPTS",
        "QUESTIONNAIRE_PDF_TIMEOUT",
    ):
        value = getattr(settings, name, None)
        if type(value) is not int or value < 1:
            errors.append(Error(f"{name} must be a positive integer.", id="leads.E003"))
    if not Path(settings.QUESTIONNAIRE_FONT_PATH).is_file():
        errors.append(
            Error(
                "QUESTIONNAIRE_FONT_PATH must point to an installed DejaVu Sans TTF font.",
                id="leads.E004",
            )
        )
    return errors
