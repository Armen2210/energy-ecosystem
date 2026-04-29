from rest_framework import status
from rest_framework.parsers import (
    FormParser,
    MultiPartParser,
    JSONParser,
)
from rest_framework.response import Response
from rest_framework.views import APIView

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
            lead = serializer.save()
            return Response(
                LeadSerializer(lead).data,
                status=status.HTTP_201_CREATED,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )