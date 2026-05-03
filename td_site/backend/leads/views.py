from datetime import timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
from rest_framework import status
from rest_framework.parsers import (
    FormParser,
    MultiPartParser,
    JSONParser,
)
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Lead
from .serializers import LeadSerializer


class LeadCreateAPIView(APIView):
    parser_classes = (
        MultiPartParser,
        FormParser,
        JSONParser,
    )

    def post(self, request):
        serializer = LeadSerializer(data=request.data)

        if serializer.is_valid():
            name = serializer.validated_data.get("name", "").strip()
            phone = serializer.validated_data.get("phone", "").strip()
            message = serializer.validated_data.get("message", "").strip()

            """
            EMAIL СЕЙЧАС НЕ ОБЯЗАТЕЛЕН.

            Если позже понадобится:
            - сделать email обязательным
            - учитывать email при поиске дублей

            то раскомментируй строку ниже.
            """

            # email = serializer.validated_data.get("email", "").strip()

            five_minutes_ago = timezone.now() - timedelta(minutes=5)

            duplicate_exists = Lead.objects.filter(
                name__iexact=name,
                phone=phone,
                message__iexact=message,

                # Если понадобится проверка дублей ещё и по email,
                # добавь строку ниже.


                # email__iexact=email,

                created_at__gte = five_minutes_ago,
            ).exists()

            if duplicate_exists:
                return Response(
                    {
                        "detail": "Похожая заявка уже была отправлена недавно."
                    },
                    status=status.HTTP_409_CONFLICT,
                )

            lead = serializer.save()

            send_mail(
                subject="Новая заявка с сайта ТД Энергоэффект",
                message=(
                    f"Имя: {lead.name}\n"
                    f"Компания: {lead.company}\n"
                    f"Телефон: {lead.phone}\n"
                    f"Email: {lead.email}\n"
                    f"Страница: {lead.source_page}\n"
                    f"Комментарий: {lead.message}\n"
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[settings.MANAGER_EMAIL],
                fail_silently=True,
            )


            return Response(
                LeadSerializer(lead).data,
                status=status.HTTP_201_CREATED,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )