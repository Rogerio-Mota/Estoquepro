from django.conf import settings
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import Q

from ..models import PerfilUsuario


def _admins_queryset():
    return User.objects.filter(
        Q(is_superuser=True) | Q(perfil__tipo=PerfilUsuario.Tipo.ADMIN)
    ).distinct()


def existe_administrador_configurado():
    return _admins_queryset().exists()


def primeiro_acesso_publico_habilitado():
    return bool(getattr(settings, "ENABLE_PUBLIC_FIRST_ACCESS", False))


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


@transaction.atomic
def configurar_administrador_principal(*, username, password=None, substituir=False):
    username = str(username or "").strip()
    if not username:
        raise ValidationError({"username": "Informe um nome de usuario valido."})

    user = User.objects.filter(username__iexact=username).first()
    admins_conflitantes = _admins_queryset()
    if user is not None:
        admins_conflitantes = admins_conflitantes.exclude(pk=user.pk)
    havia_admins_conflitantes = admins_conflitantes.exists()

    if havia_admins_conflitantes and not substituir:
        raise ValidationError(
            {
                "detail": (
                    "Ja existe um administrador principal configurado. "
                    "Use o comando com --substituir para transferir a administracao."
                )
            }
        )

    usuario_criado = False
    if user is None:
        if not password:
            raise ValidationError(
                {"password": "Informe uma senha para criar o administrador principal."}
            )
        user = User(username=username)
        usuario_criado = True
    else:
        user.username = username

    if password:
        user.set_password(password)
    elif usuario_criado or not user.has_usable_password():
        raise ValidationError(
            {"password": "Informe uma senha valida para o administrador principal."}
        )

    user.is_staff = True
    user.is_superuser = True
    user.save()

    PerfilUsuario.objects.update_or_create(
        user=user,
        defaults={"tipo": PerfilUsuario.Tipo.ADMIN},
    )

    if substituir:
        for outro_admin in admins_conflitantes:
            if outro_admin.is_superuser or outro_admin.is_staff:
                outro_admin.is_superuser = False
                outro_admin.is_staff = False
                outro_admin.save(update_fields=["is_superuser", "is_staff"])

            PerfilUsuario.objects.update_or_create(
                user=outro_admin,
                defaults={"tipo": PerfilUsuario.Tipo.FUNCIONARIO},
            )

    acao = "criado" if usuario_criado else "atualizado"
    if substituir and havia_admins_conflitantes:
        acao = "substituido"

    return user, acao
