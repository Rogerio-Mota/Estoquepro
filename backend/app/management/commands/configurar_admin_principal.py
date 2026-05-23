from getpass import getpass

from django.core.management.base import BaseCommand, CommandError
from django.core.exceptions import ValidationError

from app.services.configuracao import configurar_administrador_principal


class Command(BaseCommand):
    help = "Cria ou transfere o administrador principal do sistema."

    def add_arguments(self, parser):
        parser.add_argument(
            "--username",
            required=True,
            help="Nome de usuário do administrador principal.",
        )
        parser.add_argument(
            "--password",
            help="Senha do administrador principal. Se omitida, será solicitada no terminal.",
        )
        parser.add_argument(
            "--substituir",
            action="store_true",
            help="Transfere a administração para outro usuário quando já existir um admin principal.",
        )

    def handle(self, *args, **options):
        username = options["username"]
        password = options.get("password")
        substituir = bool(options.get("substituir"))

        if password is None:
            if not self.stdin.isatty():
                raise CommandError(
                    "Informe --password ao executar o comando sem terminal interativo."
                )

            password = getpass("Senha do administrador principal: ")
            password_confirmacao = getpass("Confirme a senha: ")

            if password != password_confirmacao:
                raise CommandError("As senhas informadas não coincidem.")

        try:
            user, acao = configurar_administrador_principal(
                username=username,
                password=password,
                substituir=substituir,
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
