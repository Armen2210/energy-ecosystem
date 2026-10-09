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

from django.conf import settings
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.core.exceptions import ValidationError as DjangoValidationError

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .lead_creation import SubmissionConflict, create_lead
from .serializers import LeadSerializer
from .request_protection import client_address, consume_client
from .upload_protection import LeadFormParser, LeadMultiPartParser, LeadUploadRejected


@method_decorator(csrf_exempt, name="dispatch")
class LeadCreateAPIView(APIView):
    authentication_classes = []
    permission_classes = []
    parser_classes = (LeadMultiPartParser, LeadFormParser)

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        if request.method != "POST":
            return
        if settings.LEAD_RATE_LIMIT_ENABLED:
            consume_client(client_address(request.META))
        # Do not access request.data/FILES/body before admission. This header
        # check is complemented by a byte-counted parser for actual input.
        try:
            length = int(request.META.get("CONTENT_LENGTH") or 0)
        except ValueError:
            raise LeadUploadRejected("Некорректный размер запроса.", status_code=400) from None
        if length > settings.LEAD_MAX_REQUEST_SIZE:
            raise LeadUploadRejected("Превышен размер запроса.")

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
                {"id": lead.id},
                status=status.HTTP_201_CREATED,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )
