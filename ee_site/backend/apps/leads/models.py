import os

from django.conf import settings
from django.core.files.storage import FileSystemStorage
from django.db import models


class PrivateLeadAttachmentStorage(FileSystemStorage):
    @property
    def base_location(self):
        return settings.LEAD_PRIVATE_ATTACHMENT_ROOT

    @property
    def location(self):
        return os.path.abspath(self.base_location)

    def url(self, name):
        raise ValueError("Private lead attachments do not have public URLs.")


def private_lead_attachment_storage():
    return PrivateLeadAttachmentStorage(base_url=None)


class Lead(models.Model):
    class Status(models.TextChoices):
        NEW = "new", "Новая"
        IN_PROGRESS = "in_progress", "В работе"
        COMPLETED = "completed", "Завершена"
        REJECTED = "rejected", "Отклонена"

    class NotificationStatus(models.TextChoices):
        UNKNOWN = "unknown", "Неизвестно"
        PENDING = "pending", "Ожидает отправки"
        SENDING = "sending", "Отправляется"
        SENT = "sent", "Отправлено"
        FAILED = "failed", "Ошибка"

    name = models.CharField(
        max_length=255,
        verbose_name="Имя"
    )

    company_name = models.CharField(
        max_length=255,
        blank=True,
        verbose_name="Компания"
    )

    phone = models.CharField(
        max_length=50,
        verbose_name="Телефон"
    )

    email = models.EmailField(
        blank=True,
        verbose_name="Email"
    )

    description = models.TextField(
        blank=True,
        verbose_name="Описание заявки"
    )

    source_page = models.CharField(
        max_length=255,
        blank=True,
        verbose_name="Страница-источник"
    )

    source_system = models.CharField(
        max_length=100,
        default="ee_site",
        verbose_name="Система-источник"
    )

    status = models.CharField(
        max_length=30,
        choices=Status.choices,
        default=Status.NEW,
        verbose_name="Статус"
    )

    attachment = models.FileField(
        upload_to="leads/attachments/",
        blank=True,
        null=True,
        verbose_name="Вложение"
    )

    notification_status = models.CharField(
        max_length=20,
        choices=NotificationStatus.choices,
        default=NotificationStatus.PENDING,
        verbose_name="Состояние уведомления",
    )

    notification_attempts = models.PositiveIntegerField(
        default=0,
        verbose_name="Попыток уведомления",
    )

    notification_last_attempt_at = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name="Последняя попытка уведомления",
    )

    notification_sent_at = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name="Уведомление принято почтовым backend",
    )

    notification_last_error_code = models.CharField(
        max_length=50,
        blank=True,
        verbose_name="Код последней ошибки уведомления",
    )

    submission_id = models.UUIDField(
        blank=True,
        null=True,
        unique=True,
        verbose_name="Идентификатор отправки",
    )

    submission_fingerprint = models.CharField(
        max_length=64,
        blank=True,
        editable=False,
        verbose_name="Отпечаток отправки",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Создана"
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Обновлена"
    )

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Заявка"
        verbose_name_plural = "Заявки"

    def __str__(self):
        return f"{self.name} — {self.phone}"


class LeadAttachment(models.Model):
    lead = models.ForeignKey(
        Lead,
        on_delete=models.CASCADE,
        related_name="attachments",
        verbose_name="Заявка",
    )
    file = models.FileField(
        upload_to="leads/attachments/",
        storage=private_lead_attachment_storage,
        verbose_name="Файл",
    )
    original_name = models.CharField(max_length=255, verbose_name="Исходное имя")
    size = models.PositiveBigIntegerField(verbose_name="Размер")
    legacy_source = models.OneToOneField(
        Lead,
        blank=True,
        null=True,
        on_delete=models.CASCADE,
        related_name="legacy_attachment_copy",
        verbose_name="Источник в старом поле",
    )
    sha256 = models.CharField(
        max_length=64,
        blank=True,
        editable=False,
        verbose_name="SHA-256",
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Создано")

    class Meta:
        ordering = ("id",)
        verbose_name = "Вложение заявки"
        verbose_name_plural = "Вложения заявки"
