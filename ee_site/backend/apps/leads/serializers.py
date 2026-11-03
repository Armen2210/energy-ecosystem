from rest_framework import serializers
from django.conf import settings

from .models import Lead
from .questionnaires import QuestionnairesField
from .attribution import CampaignField, PRODUCTS, SERVICES


class LeadSerializer(serializers.ModelSerializer):
    questionnaires = QuestionnairesField(required=False, write_only=True)
    campaign_attribution = CampaignField(required=False, write_only=True)
    direction_type = serializers.ChoiceField(choices=("", "product", "service"), required=False, write_only=True)
    direction_slug = serializers.CharField(max_length=40, required=False, allow_blank=True, write_only=True)

    def validate(self, attrs):
        if "questionnaires" in attrs and not getattr(settings, "QUESTIONNAIRES_ENABLED", False):
            raise serializers.ValidationError({"questionnaires": {"payload": "Приём электронных ОЛ временно отключён."}})
        if hasattr(self.initial_data, "getlist") and len(self.initial_data.getlist("questionnaires")) > 1:
            raise serializers.ValidationError({"questionnaires": {"payload": "Передайте один JSON-параметр."}})
        kind, slug = attrs.get("direction_type", ""), attrs.get("direction_slug", "")
        if (kind or slug) and slug not in {"product": PRODUCTS, "service": SERVICES}.get(kind, ()):
            raise serializers.ValidationError({"direction_slug": "Недопустимое направление."})
        return attrs
    submission_id = serializers.UUIDField(
        required=False,
        allow_null=True,
        write_only=True,
    )

    class Meta:
        model = Lead
        fields = (
            "questionnaires",
            "id",
            "name",
            "company_name",
            "phone",
            "email",
            "description",
            "source_page",
            "source_system",
            "direction_type",
            "direction_slug",
            "campaign_attribution",
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
