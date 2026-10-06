"""Endpoint-scoped streaming guards before Django's memory/temp handlers."""
from django.conf import settings
from django.core.exceptions import (
    RequestDataTooBig, TooManyFieldsSent, TooManyFilesSent,
)
from django.core.files.uploadhandler import FileUploadHandler
from rest_framework.exceptions import APIException
from rest_framework.parsers import FormParser, MultiPartParser


class LeadUploadRejected(APIException):
    def __init__(self, detail, code="lead_upload_limit", status_code=413):
        self.status_code = status_code
        self.detail = {"detail": detail, "code": code}


class LimitedStream:
    def __init__(self, stream, limit):
        self.stream = stream
        self.remaining = limit

    def read(self, size=-1):
        size = self.remaining + 1 if size < 0 else min(size, self.remaining + 1)
        chunk = self.stream.read(size)
        self.remaining -= len(chunk)
        if self.remaining < 0:
            raise LeadUploadRejected("Превышен размер запроса.")
        return chunk

    def readline(self, size=-1):
        size = self.remaining + 1 if size < 0 else min(size, self.remaining + 1)
        chunk = self.stream.readline(size)
        self.remaining -= len(chunk)
        if self.remaining < 0:
            raise LeadUploadRejected("Превышен размер запроса.")
        return chunk


class LeadUploadHandler(FileUploadHandler):
    chunk_size = 64 * 1024

    def __init__(self, request):
        super().__init__(request)
        self.count = 0
        self.total = 0
        self.current = 0
        self.fields = set()

    def new_file(self, field_name, *args, **kwargs):
        super().new_file(field_name, *args, **kwargs)
        self.count += 1
        self.current = 0
        self.fields.add(field_name)
        if field_name not in {"attachment", "attachments"} or len(self.fields) > 1:
            raise LeadUploadRejected("Используйте attachment или attachments.", status_code=400)
        if field_name == "attachment" and self.count > 1:
            raise LeadUploadRejected("Используйте одно поле attachment или repeated attachments.", status_code=400)
        if self.count > settings.LEAD_MAX_FILES:
            raise LeadUploadRejected("Превышено допустимое количество файлов.", status_code=400)

    def receive_data_chunk(self, raw_data, start):
        self.current += len(raw_data)
        self.total += len(raw_data)
        if self.current > settings.LEAD_MAX_FILE_SIZE:
            raise LeadUploadRejected("Превышен размер одного файла.", status_code=400)
        if self.total > settings.LEAD_MAX_TOTAL_FILE_SIZE:
            raise LeadUploadRejected("Превышен суммарный размер файлов.", status_code=400)
        return raw_data

    def file_complete(self, file_size):
        if not file_size:
            raise LeadUploadRejected("Пустые файлы не допускаются.", status_code=400)
        return None


def _check_fields(data):
    if sum(len(values) for _, values in data.lists()) > settings.LEAD_MAX_FORM_FIELDS:
        raise LeadUploadRejected("Слишком много полей формы.", "lead_form_fields_limit", 400)


class LeadMultiPartParser(MultiPartParser):
    def parse(self, stream, media_type=None, parser_context=None):
        request = parser_context["request"]
        request.upload_handlers.insert(0, LeadUploadHandler(request))
        result = None
        try:
            result = super().parse(
                LimitedStream(stream, settings.LEAD_MAX_REQUEST_SIZE),
                media_type,
                parser_context,
            )
            _check_fields(result.data)
            return result
        except (RequestDataTooBig, TooManyFieldsSent, TooManyFilesSent):
            self._close_uploads(request, result)
            raise LeadUploadRejected("Превышены ограничения формы или загрузки.") from None
        except Exception:
            self._close_uploads(request, result)
            raise

    @staticmethod
    def _close_uploads(request, result):
        # Django closes completed files on parse errors; also close the active
        # handler file, or all completed files on our post-parse field check.
        if result is not None:
            for _, files in result.files.lists():
                for uploaded in files:
                    uploaded.close()
        for handler in request.upload_handlers:
            uploaded = getattr(handler, "file", None)
            if uploaded is not None:
                uploaded.close()


class LeadFormParser(FormParser):
    def parse(self, stream, media_type=None, parser_context=None):
        try:
            limit = min(
                settings.LEAD_MAX_REQUEST_SIZE,
                settings.DATA_UPLOAD_MAX_MEMORY_SIZE or settings.LEAD_MAX_REQUEST_SIZE,
            )
            data = super().parse(
                LimitedStream(stream, limit),
                media_type,
                parser_context,
            )
            _check_fields(data)
            return data
        except TooManyFieldsSent:
            raise LeadUploadRejected("Слишком много полей формы.", "lead_form_fields_limit", 400) from None
