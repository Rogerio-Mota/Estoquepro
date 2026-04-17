from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsAdminEmpresa(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and (
                request.user.is_superuser or
                (hasattr(request.user, "perfil") and request.user.perfil.tipo == "admin")
            )
        )

class IsAdminOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return request.user.is_authenticated

        return (
            request.user.is_authenticated and (
                request.user.is_superuser or
                (hasattr(request.user, "perfil") and request.user.perfil.tipo == "admin")
            )
        )

class IsAdminOrFuncionario(BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and (
                request.user.is_superuser or
                (hasattr(request.user, "perfil") and request.user.perfil.tipo in ["admin", "funcionario"])
            )
        )