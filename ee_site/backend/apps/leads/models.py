from django.db import models


class Lead(models.Model):
    class Status(models.TextChoices):
        NEW = "new", "Новая"
        IN_PROGRESS = "in_progress", "В работе"
        COMPLETED = "completed", "Завершена"
        REJECTED = "rejected", "Отклонена"

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