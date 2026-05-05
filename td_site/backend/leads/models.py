from django.db import models


class Lead(models.Model):
    class Status(models.TextChoices):
        NEW = "new", "New"
        IN_PROGRESS = "in_progress", "In Progress"
        QUALIFIED = "qualified", "Qualified"
        REJECTED = "rejected", "Rejected"
        DONE = "done", "Done"

    name = models.CharField(max_length=255)
    company = models.CharField(max_length=255, blank=True)
    phone = models.CharField(max_length=100)
    email = models.EmailField(blank=True)
    message = models.TextField(blank=True)

    uploaded_file = models.FileField(
        upload_to="leads/",
        blank=True,
        null=True,
    )

    source_page = models.CharField(max_length=255, blank=True)

    external_id = models.CharField(
        max_length=100,
        blank=True,
        db_index=True,
    )

    source_system = models.CharField(
        max_length=50,
        default="td_site",
        db_index=True,
    )

    processing_notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.NEW,
    )

    def __str__(self):
        return f"{self.name} | {self.company}"