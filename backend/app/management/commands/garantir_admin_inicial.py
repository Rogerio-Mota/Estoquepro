import os

from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand, CommandError
from django.db.models import Q

from app.models import PerfilUsuario
from app.services.configuracao import configurar_administrador_principal


def _ja_existe_admin():
    return User.objects.filter(
        Q(is_superuser=True) | Q(perfil__tipo=PerfilUsuario.Tipo.ADMIN)
    ).exists()


class Command(BaseCommand):
    help = (
        "Cria o administrador principal apenas quando ainda nao existir "
        "nenhum administrador no sistema."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--username",
            help="Nome de usuario do administrador principal inicial.",
        )
        parser.add_argument(
            "--password",
            help="Senha do administrador principal inicial.",
        )

    def handle(self, *args, **options):
        if _ja_existe_admin():
            self.stdout.write(
                self.style.WARNING(
                    "Administrador ja configurado. Nenhuma acao necessaria."
                )
            )
            return

        username = str(
            options.get("username") or os.getenv("DJANGO_ADMIN_USERNAME", "")
        ).strip()
        password = str(
            options.get("password") or os.getenv("DJANGO_ADMIN_PASSWORD", "")
        ).strip()

        if not username or not password:
            raise CommandError(
                "Informe --username e --password ou defina DJANGO_ADMIN_USERNAME "
                "e DJANGO_ADMIN_PASSWORD."
            )

        try:
            user, acao = configurar_administrador_principal(
                username=username,
                password=password,
                substituir=False,
            )
        except ValidationError as error:
            mensagens = []
            if hasattr(error, "message_dict"):
                for campo, itens in error.message_dict.items():
                    for item in itens:
                        mensagens.append(f"{campo}: {item}")
            else:
                mensagens.extend(error.messages)
            raise CommandError(" ".join(mensagens)) from error

        self.stdout.write(
            self.style.SUCCESS(
                f"Administrador principal {acao} com sucesso: {user.username}"
            )
        )
