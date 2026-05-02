from django.contrib.auth.models import User
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import F, IntegerField, Sum
from django.db.models.functions import Coalesce
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Fornecedor, Movimentacao, PedidoVenda, Produto, Variacao
from .permissions import IsAdminEmpresa, IsAdminOrFuncionario, IsAdminOrReadOnly
from .serializers import (
    EntradaEstoqueSerializer,
    FornecedorSerializer,
    MovimentacaoSerializer,
    PedidoVendaSerializer,
    ProdutoSerializer,
    SaidaEstoqueSerializer,
    UsuarioLogadoSerializer,
    UsuarioSerializer,
    VariacaoSerializer,
)
from .services import (
    criar_administrador_inicial,
    existe_administrador_configurado,
    gerar_relatorio_vendas,
    registrar_movimentacao,
    resolver_periodo_relatorio,
)


def _raise_drf_validation(error):
    if hasattr(error, "message_dict"):
        raise ValidationError(error.message_dict)
    raise ValidationError(error.messages)


def _usuario_eh_admin(user):
    return bool(
        user.is_superuser
        or (hasattr(user, "perfil") and user.perfil.tipo == "admin")
    )


def _existe_outro_admin(user_id):
    return User.objects.exclude(pk=user_id).filter(
        is_superuser=True
    ).exists() or User.objects.exclude(pk=user_id).filter(
        perfil__tipo="admin"
    ).exists()


class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = User.objects.select_related("perfil").order_by("username")
    serializer_class = UsuarioSerializer
    permission_classes = [IsAdminEmpresa]

    def destroy(self, request, *args, **kwargs):
        usuario = self.get_object()
        if _usuario_eh_admin(usuario) and not _existe_outro_admin(usuario.pk):
            raise ValidationError(
                {"detail": "O sistema precisa manter um administrador principal."}
            )

        return super().destroy(request, *args, **kwargs)


class UsuarioLogadoView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UsuarioLogadoSerializer(request.user)
        return Response(serializer.data)


class PrimeiroAcessoView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(
            {
                "primeiro_acesso_pendente": not existe_administrador_configurado(),
            }
        )

    def post(self, request):
        from .serializers import PrimeiroAcessoSerializer

        serializer = PrimeiroAcessoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            user = criar_administrador_inicial(
                username=serializer.validated_data["username"],
                password=serializer.validated_data["password"],
            )
        except DjangoValidationError as error:
            _raise_drf_validation(error)

        return Response(
            {
                "message": "Administrador inicial criado com sucesso.",
                "username": user.username,
            },
            status=status.HTTP_201_CREATED,
        )


class BaseMovimentacaoEstoqueView(APIView):
    permission_classes = [IsAdminOrFuncionario]
    serializer_class = None
    tipo_movimentacao = None
    mensagem_sucesso = ""

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            movimentacao, variacao = registrar_movimentacao(
                variacao=serializer.validated_data["variacao"],
                tipo=self.tipo_movimentacao,
                quantidade=serializer.validated_data["quantidade"],
                observacao=serializer.validated_data.get("observacao") or "",
                usuario=request.user,
                fornecedor=serializer.validated_data.get("fornecedor"),
                data_referencia=serializer.validated_data.get("data_referencia"),
            )
        except DjangoValidationError as error:
            _raise_drf_validation(error)

        return Response(
            {
                "message": self.mensagem_sucesso,
                "movimentacao_id": movimentacao.id,
                "variacao_id": variacao.id,
                "novo_saldo": variacao.saldo_atual,
            },
            status=status.HTTP_201_CREATED,
        )


class EntradaEstoqueView(BaseMovimentacaoEstoqueView):
    serializer_class = EntradaEstoqueSerializer
    tipo_movimentacao = Movimentacao.Tipo.ENTRADA
    mensagem_sucesso = "Entrada registrada com sucesso."


class SaidaEstoqueView(BaseMovimentacaoEstoqueView):
    serializer_class = SaidaEstoqueSerializer
    tipo_movimentacao = Movimentacao.Tipo.SAIDA
    mensagem_sucesso = "Saida registrada com sucesso."


class RelatorioVendasView(APIView):
    permission_classes = [IsAdminOrFuncionario]

    def get(self, request):
        try:
            relatorio = gerar_relatorio_vendas(
                periodo=request.query_params.get("periodo", "mes"),
            )
        except DjangoValidationError as error:
            _raise_drf_validation(error)

        return Response(relatorio)


class FornecedorViewSet(viewsets.ModelViewSet):
    queryset = Fornecedor.objects.prefetch_related("produtos").order_by("nome")
    serializer_class = FornecedorSerializer
    permission_classes = [IsAdminOrReadOnly]
    search_fields = ["nome", "contato", "cidade", "produtos__nome"]
    ordering_fields = ["nome", "cidade", "criado_em"]


class ProdutoViewSet(viewsets.ModelViewSet):
    queryset = (
        Produto.objects.select_related("fornecedor")
        .prefetch_related("variacoes")
        .order_by("nome")
    )
    serializer_class = ProdutoSerializer
    permission_classes = [IsAdminOrReadOnly]
    filterset_fields = ["categoria", "subcategoria", "marca"]
    search_fields = ["nome", "marca", "sku"]
    ordering_fields = ["nome", "preco_venda", "estoque_minimo", "criado_em"]

    @action(detail=False, methods=["get"], url_path="estoque-baixo")
    def estoque_baixo(self, request):
        queryset = (
            self.filter_queryset(self.get_queryset())
            .annotate(
                estoque_total_calculado=Coalesce(
                    Sum("variacoes__saldo_atual"),
                    0,
                    output_field=IntegerField(),
                )
            )
            .filter(estoque_total_calculado__lte=F("estoque_minimo"))
        )
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class VariacaoViewSet(viewsets.ModelViewSet):
    queryset = (
        Variacao.objects.select_related("produto", "produto__fornecedor")
        .order_by("produto__nome")
    )
    serializer_class = VariacaoSerializer
    permission_classes = [IsAdminOrReadOnly]
    filterset_fields = [
        "produto",
        "produto__categoria",
        "produto__subcategoria",
        "tamanho",
        "numeracao",
        "cor",
    ]
    search_fields = ["produto__nome", "produto__marca", "produto__sku", "cor"]
    ordering_fields = ["saldo_atual", "criado_em"]


class MovimentacaoViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Movimentacao.objects.none()
    serializer_class = MovimentacaoSerializer
    permission_classes = [IsAdminOrFuncionario]
    filterset_fields = ["tipo", "variacao", "variacao__produto", "fornecedor"]
    search_fields = [
        "variacao__produto__nome",
        "variacao__produto__marca",
        "variacao__produto__sku",
        "observacao",
        "responsavel__username",
        "fornecedor__nome",
    ]
    ordering_fields = ["data", "data_referencia", "quantidade"]

    def get_queryset(self):
        queryset = (
            Movimentacao.objects.select_related(
                "variacao",
                "variacao__produto",
                "fornecedor",
                "responsavel",
                "responsavel__perfil",
            )
            .order_by("-data", "-id")
        )
        periodo = self.request.query_params.get("periodo")
        if periodo:
            try:
                recorte = resolver_periodo_relatorio(periodo)
            except DjangoValidationError as error:
                _raise_drf_validation(error)
            queryset = queryset.filter(data_referencia__range=(recorte["inicio"].date(), recorte["fim"].date()))

        return queryset


class PedidoVendaViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    queryset = (
        PedidoVenda.objects.filter(status=PedidoVenda.Status.FINALIZADO)
        .select_related("criado_por")
        .prefetch_related("itens", "itens__variacao", "itens__variacao__produto")
        .order_by("-criado_em")
    )
    serializer_class = PedidoVendaSerializer
    permission_classes = [IsAdminOrFuncionario]
    search_fields = [
        "cliente_nome",
        "id",
        "itens__variacao__produto__nome",
        "itens__variacao__produto__sku",
    ]
    ordering_fields = ["criado_em", "atualizado_em"]
