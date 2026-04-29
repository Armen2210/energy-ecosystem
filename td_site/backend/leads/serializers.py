from rest_framework import serializers

from .models import Lead


class LeadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lead
        fields = (
            "id",
            "name",
            "company",
            "phone",
            "email",
            "message",
            "uploaded_file",
            "source_page",
            "created_at",
            "status",
        )
        read_only_fields = (
            "id",
            "created_at",
            "status",
        )