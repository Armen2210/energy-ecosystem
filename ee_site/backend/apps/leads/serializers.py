from rest_framework import serializers

from .models import Lead


class LeadSerializer(serializers.ModelSerializer):
    submission_id = serializers.UUIDField(
        required=False,
        allow_null=True,
        write_only=True,
    )

    class Meta:
        model = Lead
        fields = (
            "id",
            "name",
            "company_name",
            "phone",
            "email",
            "description",
            "source_page",
            "source_system",
            "status",
            "attachment",
            "submission_id",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "status",
            "created_at",
            "updated_at",
        )
