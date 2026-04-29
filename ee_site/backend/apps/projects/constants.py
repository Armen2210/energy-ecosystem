from django.db import models


class ProjectStatuses(models.TextChoices):
    DRAFT = "draft", "Draft"
    NEW = "new", "New"
    IN_PROGRESS = "in_progress", "In Progress"
    NEEDS_CLARIFICATION = "needs_clarification", "Needs Clarification"
    DOCUMENTS_READY = "documents_ready", "Documents Ready"
    COMPLETED = "completed", "Completed"
    ERROR = "error", "Error"