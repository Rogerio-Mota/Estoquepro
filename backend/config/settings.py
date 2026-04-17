import os
from datetime import timedelta
from pathlib import Path
from urllib.parse import parse_qsl, unquote, urlparse

from django.core.exceptions import ImproperlyConfigured


BASE_DIR = Path(__file__).resolve().parent.parent


def _load_env_file():
    for env_path in (BASE_DIR / ".env", BASE_DIR.parent / ".env"):
        if not env_path.exists():
            continue

        for raw_line in env_path.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue

            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip()

            if not key or key in os.environ:
                continue

            if len(value) >= 2 and value[0] == value[-1] and value[0] in {'"', "'"}:
                value = value[1:-1]

            os.environ[key] = value


def _get_bool_env(name, default=False):
    return os.getenv(name, str(default)).strip().lower() in {"1", "true", "yes", "on"}


def _get_csv_env(name, default=""):
    return [item.strip() for item in os.getenv(name, default).split(",") if item.strip()]


def _postgres_database_config_from_url(database_url):
    parsed = urlparse(database_url)
    query_options = dict(parse_qsl(parsed.query))
    database_name = unquote(parsed.path.lstrip("/")) or os.getenv("POSTGRES_DB", "postgres")

    config = {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": database_name,
        "USER": unquote(parsed.username or os.getenv("POSTGRES_USER", "")),
        "PASSWORD": unquote(parsed.password or os.getenv("POSTGRES_PASSWORD", "")),
        "HOST": parsed.hostname or os.getenv("POSTGRES_HOST", "localhost"),
        "PORT": str(parsed.port or os.getenv("POSTGRES_PORT", "5432")),
        "CONN_MAX_AGE": int(os.getenv("DB_CONN_MAX_AGE", "60")),
    }

    if query_options:
        config["OPTIONS"] = query_options

    return config


def _postgres_database_config_from_env():
    database_name = os.getenv("POSTGRES_DB", "").strip()
    if not database_name:
        return None

    config = {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": database_name,
        "USER": os.getenv("POSTGRES_USER", "").strip(),
        "PASSWORD": os.getenv("POSTGRES_PASSWORD", "").strip(),
        "HOST": os.getenv("POSTGRES_HOST", "localhost").strip(),
        "PORT": os.getenv("POSTGRES_PORT", "5432").strip(),
        "CONN_MAX_AGE": int(os.getenv("DB_CONN_MAX_AGE", "60")),
    }

    sslmode = os.getenv("POSTGRES_SSLMODE", "").strip()
    if sslmode:
        config["OPTIONS"] = {"sslmode": sslmode}

    return config


def _build_database_config():
    database_url = os.getenv("DATABASE_URL", "").strip()
    if database_url:
        return _postgres_database_config_from_url(database_url)

    postgres_config = _postgres_database_config_from_env()
    if postgres_config is not None:
        return postgres_config

    raise ImproperlyConfigured(
        "Configure DATABASE_URL ou POSTGRES_DB para usar PostgreSQL."
    )


_load_env_file()

SECRET_KEY = os.getenv(
    "DJANGO_SECRET_KEY",
    "django-insecure-dev-only-key-change-in-production",
)
DEBUG = _get_bool_env("DJANGO_DEBUG", True)
ALLOWED_HOSTS = _get_csv_env("DJANGO_ALLOWED_HOSTS", "127.0.0.1,localhost")
CORS_ALLOWED_ORIGINS = _get_csv_env(
    "DJANGO_CORS_ALLOWED_ORIGINS",
    "http://127.0.0.1:5173,http://localhost:5173",
)

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "app.apps.EstoqueAppConfig",
    "rest_framework",
    "django_filters",
    "corsheaders",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

DATABASES = {"default": _build_database_config()}

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

LANGUAGE_CODE = "pt-br"
TIME_ZONE = "America/Sao_Paulo"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ],
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": False,
    "BLACKLIST_AFTER_ROTATION": False,
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
