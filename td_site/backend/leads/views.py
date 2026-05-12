import logging
from datetime import timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
from rest_framework import status
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Lead
from .serializers import LeadSerializer

logger = logging.getLogger(__name__)


def build_lead_email_message(lead):
    return (
        "Новая заявка с сайта ТД Энергоэффект\n\n"
        f"Имя: {lead.name}\n"
        f"Компания: {lead.company or '-'}\n"
        f"Телефон: {lead.phone}\n"
        f"Email: {lead.email or '-'}\n"
        f"Страница: {lead.source_page or '-'}\n"
        f"Источник системы: {lead.source_system}\n"
        f"Комментарий:\n{lead.message or '-'}\n"
    )


from rest_framework.permissions import AllowAny

class LeadCreateAPIView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    parser_classes = (
        MultiPartParser,
        FormParser,
        JSONParser,
    )

    def post(self, request):
        logger.info("Incoming lead request: %s", request.data)

        serializer = LeadSerializer(data=request.data)

        if serializer.is_valid():
            name = serializer.validated_data.get("name", "").strip()
            phone = serializer.validated_data.get("phone", "").strip()
            message = serializer.validated_data.get("message", "").strip()

            five_minutes_ago = timezone.now() - timedelta(minutes=5)

            duplicate_exists = Lead.objects.filter(
                name__iexact=name,
                phone=phone,
                message__iexact=message,
                created_at__gte=five_minutes_ago,
            ).exists()

            if duplicate_exists:
                logger.warning(
                    "Duplicate lead rejected: name=%s, phone=%s",
                    name,
                    phone,
                )

                return Response(
                    {
                        "detail": "Похожая заявка уже была отправлена недавно."
                    },
                    status=status.HTTP_409_CONFLICT,
                )

            lead = serializer.save()

            logger.info("Lead created: id=%s, phone=%s", lead.id, lead.phone)

            send_mail(
                subject="Новая заявка с сайта ТД Энергоэффект",
                message=build_lead_email_message(lead),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[settings.MANAGER_EMAIL],
                fail_silently=True,
            )

            return Response(
                LeadSerializer(lead).data,
                status=status.HTTP_201_CREATED,
            )

        logger.error("Lead validation error: %s", serializer.errors)

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )