from django.db import models


class Lead(models.Model):

    STATUS_CHOICES = [
        ("new", "New"),
        ("in_progress", "In Progress"),
        ("done", "Done"),
        ("spam", "Spam"),
    ]

    name = models.CharField(max_length=255)
    company = models.CharField(max_length=255, blank=True)
    phone = models.CharField(max_length=100)
    email = models.EmailField(blank=True)
    message = models.TextField(blank=True)

    uploaded_file = models.FileField(
        upload_to="leads/",
        blank=True,
        null=True
    )

    source_page = models.CharField(
        max_length=255,
        blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="new"
    )

    def __str__(self):
        return f"{self.name} | {self.company}"