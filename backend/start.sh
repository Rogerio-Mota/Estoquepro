#!/usr/bin/env bash
set -euo pipefail

python manage.py migrate --noinput

if [[ -n "${DJANGO_ADMIN_USERNAME:-}" && -n "${DJANGO_ADMIN_PASSWORD:-}" ]]; then
  python manage.py garantir_admin_inicial
fi

exec gunicorn config.wsgi:application --bind "0.0.0.0:${PORT:-8000}"
