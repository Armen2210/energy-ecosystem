import os


_previous_skip_dotenv = os.environ.get("_EE_SKIP_DOTENV")
os.environ["_EE_SKIP_DOTENV"] = "1"
try:
    from .base import *
finally:
    if _previous_skip_dotenv is None:
        os.environ.pop("_EE_SKIP_DOTENV", None)
    else:
        os.environ["_EE_SKIP_DOTENV"] = _previous_skip_dotenv
    del _previous_skip_dotenv


# Explicitly isolated settings for automated tests. They are never selected by
# local.py or prod.py and do not connect to PostgreSQL or an SMTP server.
SECRET_KEY = "test-only-not-a-secret"

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}

EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]
