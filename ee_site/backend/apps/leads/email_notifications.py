# =========================================================
# LEADS EMAIL NOTIFICATIONS / EMAIL-УВЕДОМЛЕНИЯ ПО ЗАЯВКАМ
# Отвечает за отправку письма менеджеру после создания заявки.
#
# Важно:
# - форма заявки не должна ломаться, если email временно недоступен;
# - SMTP-настройки берутся из .env через Django settings;
# - вложение из заявки прикрепляется к письму, если оно есть.
# =========================================================

import logging

from django.conf import settings
from django.core.mail import EmailMessage


logger = logging.getLogger(__name__)


def send_lead_notification(lead):
    """
    Отправляет email-уведомление менеджеру о новой заявке.

    Возвращает:
        True  — письмо отправлено;
        False — письмо не отправлено, но заявка сохранена.
    """

    recipient_emails = getattr(settings, "LEAD_NOTIFICATION_EMAIL", "")

    if not recipient_emails:
        logger.warning(
            "Lead notification email is not configured. "
            "Set LEAD_NOTIFICATION_EMAIL in .env."
        )
        return False

    recipients = [
        email.strip()
        for email in recipient_emails.split(",")
        if email.strip()
    ]

    if not recipients:
        logger.warning("Lead notification recipients list is empty.")
        return False

    subject = f"Новая заявка с сайта Энергоэффект: {lead.name}"

    body = (
        "На сайте ООО «Энергоэффект» отправлена новая заявка.\n\n"
        f"ID заявки: {lead.id}\n"
        f"Имя: {lead.name}\n"
        f"Компания: {lead.company_name or 'Не указана'}\n"
        f"Телефон: {lead.phone}\n"
        f"Email: {lead.email or 'Не указан'}\n"
        f"Страница-источник: {lead.source_page or 'Не указана'}\n"
        f"Система-источник: {lead.source_system or 'Не указана'}\n"
        f"Статус: {lead.get_status_display()}\n\n"
        "Описание заявки:\n"
        f"{lead.description or 'Не указано'}\n\n"
        "Заявка также сохранена в Django Admin."
    )

    try:
        message = EmailMessage(
            subject=subject,
            body=body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=recipients,
            reply_to=[lead.email] if lead.email else None,
        )

        if lead.attachment:
            message.attach_file(lead.attachment.path)

        message.send(fail_silently=False)

        logger.info("Lead notification email sent for lead_id=%s", lead.id)
        return True

    except Exception:
        logger.exception(
            "Failed to send lead notification email for lead_id=%s",
            lead.id,
        )
        return False