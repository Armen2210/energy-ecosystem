# =========================================================
# LEADS VIEWS / API-ПРЕДСТАВЛЕНИЯ ЗАЯВОК
# Публичный endpoint для отправки заявки с сайта.
#
# Особенности:
# - CSRF отключён только для публичной формы заявки;
# - заявка сохраняется в базе данных;
# - после сохранения отправляется email-уведомление менеджеру;
# - ошибка отправки email не ломает сохранение заявки.
# =========================================================

from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .email_notifications import send_lead_notification
from .serializers import LeadSerializer


@method_decorator(csrf_exempt, name="dispatch")
class LeadCreateAPIView(APIView):
    authentication_classes = []
    permission_classes = []
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, *args, **kwargs):
        serializer = LeadSerializer(data=request.data)

        if serializer.is_valid():
            lead = serializer.save()

            # Отправляем email-уведомление менеджеру.
            # Функция сама обрабатывает ошибки, чтобы форма не ломалась,
            # если SMTP временно недоступен или не настроен.
            send_lead_notification(lead)

            return Response(
                LeadSerializer(lead).data,
                status=status.HTTP_201_CREATED,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )