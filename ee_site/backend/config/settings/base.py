import math
import os
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured
from dotenv import load_dotenv

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent.parent
if os.getenv("_EE_SKIP_DOTENV") != "1":
    load_dotenv(BASE_DIR / ".env")


def positive_int_from_env(name, default):
    raw_value = os.getenv(name, str(default))
    try:
        value = int(raw_value)
    except (TypeError, ValueError) as exc:
        raise ImproperlyConfigured(f"{name} must be a positive integer.") from exc
    if value <= 0:
        raise ImproperlyConfigured(f"{name} must be a positive integer.")
    return value

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.2/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY")

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv("DJANGO_DEBUG") == "True"

ALLOWED_HOSTS = os.getenv(
    "DJANGO_ALLOWED_HOSTS",
    ""
).split(",")




# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    'corsheaders',
    'rest_framework',

    "apps.users",
    "apps.companies",
    "apps.projects",
    "apps.activity_logs",
    "apps.leads",
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'


# Database
# https://docs.djangoproject.com/en/5.2/ref/settings/#databases

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("DB_NAME"),
        "USER": os.getenv("DB_USER"),
        "PASSWORD": os.getenv("DB_PASSWORD"),
        "HOST": os.getenv("DB_HOST"),
        "PORT": os.getenv("DB_PORT"),
    }
}


# Password validation
# https://docs.djangoproject.com/en/5.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/5.2/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.2/howto/static-files/

STATIC_URL = 'static/'

# Default primary key field type
# https://docs.djangoproject.com/en/5.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

AUTH_USER_MODEL = "users.User"

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"
LEAD_PRIVATE_ATTACHMENT_ROOT = Path(
    os.getenv("LEAD_PRIVATE_ATTACHMENT_ROOT", BASE_DIR / "private_uploads")
)
LEAD_MAX_FILES = positive_int_from_env("LEAD_MAX_FILES", 10)
LEAD_MAX_FILE_SIZE = positive_int_from_env("LEAD_MAX_FILE_SIZE", 10 * 1024 * 1024)
LEAD_MAX_TOTAL_FILE_SIZE = positive_int_from_env(
    "LEAD_MAX_TOTAL_FILE_SIZE", 25 * 1024 * 1024
)
LEAD_EMAIL_ATTACHMENT_MAX_TOTAL_SIZE = positive_int_from_env(
    "LEAD_EMAIL_ATTACHMENT_MAX_TOTAL_SIZE", 10 * 1024 * 1024
)


def choice_from_env(name, default, choices):
    value = os.getenv(name, default).strip().lower()
    if value not in choices:
        allowed = ", ".join(sorted(choices))
        raise ImproperlyConfigured(f"{name} must be one of: {allowed}.")
    return value


# ``sync`` is deliberately the safe upgrade default.  Switch this to
# ``background`` only after the separately supervised worker is ready.
LEAD_NOTIFICATION_MODE = choice_from_env(
    "LEAD_NOTIFICATION_MODE", "sync", {"sync", "background"}
)

# =========================================================
# EMAIL / НАСТРОЙКИ ПОЧТОВЫХ УВЕДОМЛЕНИЙ
# Используются для отправки заявок менеджеру с сайта.
# Значения берутся из .env, чтобы не хранить пароли в коде.
# =========================================================

EMAIL_BACKEND = os.getenv(
    "EMAIL_BACKEND",
    "django.core.mail.backends.smtp.EmailBackend",
)

EMAIL_HOST = os.getenv("EMAIL_HOST", "")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))


def positive_finite_float_from_env(name, default):
    raw_value = os.getenv(name, str(default))

    try:
        value = float(raw_value)
    except (TypeError, ValueError) as exc:
        raise ImproperlyConfigured(
            f"{name} must be a positive finite number of seconds."
        ) from exc

    if not math.isfinite(value) or value <= 0:
        raise ImproperlyConfigured(
            f"{name} must be a positive finite number of seconds."
        )

    return value


EMAIL_TIMEOUT = positive_finite_float_from_env("EMAIL_TIMEOUT", 10)

EMAIL_USE_TLS = os.getenv("EMAIL_USE_TLS", "True") == "True"
EMAIL_USE_SSL = os.getenv("EMAIL_USE_SSL", "False") == "True"

EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "")

DEFAULT_FROM_EMAIL = os.getenv(
    "DEFAULT_FROM_EMAIL",
    EMAIL_HOST_USER or "noreply@energoeffekt-rostov.ru",
)

SERVER_EMAIL = os.getenv(
    "SERVER_EMAIL",
    DEFAULT_FROM_EMAIL,
)

LEAD_NOTIFICATION_EMAIL = os.getenv(
    "LEAD_NOTIFICATION_EMAIL",
    "",
)

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,

    "formatters": {
        "verbose": {
            "format": "[{asctime}] {levelname} {name}: {message}",
            "style": "{",
        },
        "simple": {
            "format": "{levelname}: {message}",
            "style": "{",
        },
    },

    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "simple",
        },
    },

    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },

    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
    },
}

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]


# Public EE lead endpoint only. The store is separate from application data,
# shared by all Gunicorn workers on ONE host, and must not live on NFS.
LEAD_RATE_LIMIT_ENABLED = choice_from_env(
    "LEAD_RATE_LIMIT_ENABLED", "true", {"true", "false"}
) == "true"
LEAD_RATE_STORE = Path(os.getenv("LEAD_RATE_STORE", BASE_DIR / "lead_rate_limits.sqlite3"))
LEAD_RATE_BURST_LIMIT = positive_int_from_env("LEAD_RATE_BURST_LIMIT", 20)
LEAD_RATE_BURST_SECONDS = positive_int_from_env("LEAD_RATE_BURST_SECONDS", 60)
LEAD_RATE_SUSTAINED_LIMIT = positive_int_from_env("LEAD_RATE_SUSTAINED_LIMIT", 100)
LEAD_RATE_SUSTAINED_SECONDS = positive_int_from_env("LEAD_RATE_SUSTAINED_SECONDS", 3600)
LEAD_TRUSTED_PROXY_NETWORKS = [
    value.strip() for value in os.getenv("LEAD_TRUSTED_PROXY_NETWORKS", "").split(",")
    if value.strip()
]
LEAD_TRUST_UNIX_SOCKET_PROXY = choice_from_env(
    "LEAD_TRUST_UNIX_SOCKET_PROXY", "false", {"true", "false"}
) == "true"
# Whole body, including multipart overhead, distinct from document limits.
LEAD_MAX_REQUEST_SIZE = positive_int_from_env("LEAD_MAX_REQUEST_SIZE", 27 * 1024 * 1024)
LEAD_MAX_FORM_FIELDS = positive_int_from_env("LEAD_MAX_FORM_FIELDS", 64)
