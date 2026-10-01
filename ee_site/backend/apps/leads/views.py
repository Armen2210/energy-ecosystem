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
from django.core.exceptions import ValidationError as DjangoValidationError

from rest_framework import status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .lead_creation import SubmissionConflict, create_lead
from .serializers import LeadSerializer


@method_decorator(csrf_exempt, name="dispatch")
class LeadCreateAPIView(APIView):
    authentication_classes = []
    permission_classes = []
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, *args, **kwargs):
        serializer = LeadSerializer(data=request.data)

        if serializer.is_valid():
            try:
                lead, created = create_lead(
                    serializer.validated_data,
                    request.FILES.getlist("attachments"),
                )
            except DjangoValidationError as exc:
                return Response(exc.message_dict, status=status.HTTP_400_BAD_REQUEST)
            except SubmissionConflict:
                return Response(
                    {
                        "detail": "submission_id уже использован для других данных.",
                        "code": "submission_conflict",
                    },
                    status=status.HTTP_409_CONFLICT,
                )

            if not created:
                return Response(
                    {"id": lead.id, "duplicate": True},
                    status=status.HTTP_200_OK,
                )

            return Response(
                LeadSerializer(lead).data,
                status=status.HTTP_201_CREATED,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )
