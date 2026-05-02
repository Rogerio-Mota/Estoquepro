from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Q

from ..models import PerfilUsuario


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
