from typing import Any

from rest_framework.permissions import BasePermission, SAFE_METHODS


def _usuario_eh_admin(user: Any) -> bool:
    return bool(
        getattr(user, "is_authenticated", False)
        and (
            getattr(user, "is_superuser", False)
            or (
                hasattr(user, "perfil")
                and getattr(user.perfil, "tipo", None) == "admin"
            )
        )
    )


def _usuario_eh_admin_ou_funcionario(user: Any) -> bool:
    return bool(
        getattr(user, "is_authenticated", False)
        and (
            getattr(user, "is_superuser", False)
            or (
                hasattr(user, "perfil")
                and getattr(user.perfil, "tipo", None) in {"admin", "funcionario"}
            )
        )
    )


class IsAdminEmpresa(BasePermission):
    def has_permission(self, request: Any, view: Any) -> bool:
        return _usuario_eh_admin(request.user)


class IsAdminOrReadOnly(BasePermission):
    def has_permission(self, request: Any, view: Any) -> bool:
        if request.method in SAFE_METHODS:
            return bool(getattr(request.user, "is_authenticated", False))

        return _usuario_eh_admin(request.user)


class IsAdminOrFuncionario(BasePermission):
    def has_permission(self, request: Any, view: Any) -> bool:
        return _usuario_eh_admin_ou_funcionario(request.user)
