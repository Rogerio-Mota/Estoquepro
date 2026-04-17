from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.db import OperationalError, ProgrammingError, transaction
from django.db.models import Q

from ..models import ConfiguracaoSistema, PerfilUsuario


def obter_configuracao_sistema():
    try:
        configuracao, _ = ConfiguracaoSistema.objects.get_or_create(pk=1)
    except (OperationalError, ProgrammingError) as error:
        raise ValidationError(
            {
                "configuracao_sistema": (
                    "A estrutura do banco esta desatualizada para as configuracoes do sistema. "
                    "Execute 'python manage.py migrate' no backend e tente novamente."
                )
            }
        ) from error

    return configuracao


def existe_administrador_configurado():
    return User.objects.filter(
        Q(is_superuser=True) | Q(perfil__tipo=PerfilUsuario.Tipo.ADMIN)
    ).exists()


@transaction.atomic
def criar_administrador_inicial(*, username, password):
    if existe_administrador_configurado():
        raise ValidationError(
            {"detail": "O primeiro acesso ja foi concluido para este sistema."}
        )

    user = User.objects.create_user(username=username, password=password)
    PerfilUsuario.objects.update_or_create(
        user=user,
        defaults={"tipo": PerfilUsuario.Tipo.ADMIN},
    )
    return user
