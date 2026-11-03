from django.urls import path

from .views import LeadCreateAPIView, QuestionnaireCapabilitiesAPIView


urlpatterns = [
    path("questionnaire-capabilities/", QuestionnaireCapabilitiesAPIView.as_view(), name="questionnaire-capabilities"),
    path("", LeadCreateAPIView.as_view(), name="lead-create"),
]