from django.contrib.auth.models import User
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import F, IntegerField, Sum
from django.db.models.functions import Coalesce
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Fornecedor, Movimentacao, PedidoVenda, Produto, Variacao
from .permissions import IsAdminEmpresa, IsAdminOrFuncionario, IsAdminOrReadOnly
from .serializers import (
    ConfiguracaoSistemaSerializer,
    EntradaEstoqueSerializer,
    FornecedorSerializer,
    NotaFiscalImportacaoAplicarSerializer,
    NotaFiscalImportacaoPreviewSerializer,
    MovimentacaoSerializer,
    PedidoVendaSerializer,
    ProdutoSerializer,
    SaidaEstoqueSerializer,
    UsuarioLogadoSerializer,
    UsuarioSerializer,
    VariacaoSerializer,
)
from .services import (
    aplicar_importacao_nota_fiscal,
    criar_administrador_inicial,
    existe_administrador_configurado,
    gerar_relatorio_mensal,
    gerar_relatorio_reposicao,
    limpar_importacao_nota_fiscal,
    obter_configuracao_sistema,
    parse_nota_fiscal,
    registrar_movimentacao,
)


def _raise_drf_validation(error):
    if hasattr(error, "message_dict"):
        raise ValidationError(error.message_dict)
    raise ValidationError(error.messages)


def _usuario_admin(user):
    return bool(
        user.is_authenticated
        and (
            user.is_superuser
            or (hasattr(user, "perfil") and user.perfil.tipo == "admin")
        )
    )


class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = User.objects.select_related("perfil").order_by("username")
    serializer_class = UsuarioSerializer
    permission_classes = [IsAdminEmpresa]


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


class ConfiguracaoSistemaView(APIView):
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        try:
            configuracao = obter_configuracao_sistema()
        except DjangoValidationError as error:
            _raise_drf_validation(error)

        serializer = ConfiguracaoSistemaSerializer(
            configuracao,
            context={"request": request},
        )
        return Response(serializer.data)

    def patch(self, request):
        if not _usuario_admin(request.user):
            return Response(
                {"detail": "Você não tem permissão para atualizar as configurações."},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            configuracao = obter_configuracao_sistema()
        except DjangoValidationError as error:
            _raise_drf_validation(error)

        serializer = ConfiguracaoSistemaSerializer(
            configuracao,
            data=request.data,
            partial=True,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save(atualizado_por=request.user)
        return Response(serializer.data)


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
    mensagem_sucesso = "Saída registrada com sucesso."


class NotaFiscalImportacaoPreviewView(APIView):
    permission_classes = [IsAdminOrFuncionario]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        serializer = NotaFiscalImportacaoPreviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            preview = parse_nota_fiscal(serializer.validated_data["arquivo"])
        except DjangoValidationError as error:
            _raise_drf_validation(error)

        return Response(preview)


class NotaFiscalImportacaoAplicarView(APIView):
    permission_classes = [IsAdminOrFuncionario]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        serializer = NotaFiscalImportacaoAplicarSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            resultado = aplicar_importacao_nota_fiscal(
                arquivo=serializer.validated_data["arquivo"],
                mapeamentos=serializer.validated_data["mapeamentos"],
                fornecedor_resolucao=serializer.validated_data.get("fornecedor"),
                usuario=request.user,
            )
        except DjangoValidationError as error:
            _raise_drf_validation(error)

        return Response(
            {
                "message": "Nota fiscal importada com sucesso.",
                **resultado,
            },
            status=status.HTTP_201_CREATED,
        )


class NotaFiscalImportacaoLimparView(APIView):
    permission_classes = [IsAdminEmpresa]

    def delete(self, request, importacao_id):
        try:
            resultado = limpar_importacao_nota_fiscal(
                importacao_id=importacao_id,
                usuario=request.user,
            )
        except DjangoValidationError as error:
            _raise_drf_validation(error)

        message = "Importacao removida com sucesso."
        if resultado.get("itens_sem_vinculo"):
            message = (
                "Importacao removida com sucesso. "
                "Alguns itens antigos nao tinham vinculo de estoque e foram apenas "
                "retirados do historico de importacao."
            )

        return Response(
            {
                "message": message,
                **resultado,
            }
        )


class RelatorioMensalView(APIView):
    permission_classes = [IsAdminOrFuncionario]

    def get(self, request):
        try:
            relatorio = gerar_relatorio_mensal(
                ano=request.query_params.get("ano"),
                mes=request.query_params.get("mes"),
            )
        except DjangoValidationError as error:
            _raise_drf_validation(error)

        return Response(relatorio)


class RelatorioReposicaoView(APIView):
    permission_classes = [IsAdminOrFuncionario]

    def get(self, request):
        try:
            relatorio = gerar_relatorio_reposicao(
                dias_base=request.query_params.get("dias_base", 30)
            )
        except DjangoValidationError as error:
            _raise_drf_validation(error)

        return Response(relatorio)


class FornecedorViewSet(viewsets.ModelViewSet):
    queryset = Fornecedor.objects.order_by("nome")
    serializer_class = FornecedorSerializer
    permission_classes = [IsAdminOrReadOnly]
    search_fields = ["nome", "documento", "contato", "email"]
    ordering_fields = ["nome", "criado_em"]


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
    queryset = (
        Movimentacao.objects.select_related(
            "variacao",
            "variacao__produto",
            "responsavel",
            "responsavel__perfil",
        )
        .order_by("-data")
    )
    serializer_class = MovimentacaoSerializer
    permission_classes = [IsAdminOrFuncionario]
    filterset_fields = ["tipo", "variacao", "variacao__produto"]
    search_fields = [
        "variacao__produto__nome",
        "variacao__produto__marca",
        "variacao__produto__sku",
        "observacao",
        "responsavel__username",
    ]
    ordering_fields = ["data", "quantidade"]


class PedidoVendaViewSet(viewsets.ModelViewSet):
    queryset = (
        PedidoVenda.objects.select_related("criado_por")
        .prefetch_related("itens", "itens__variacao", "itens__variacao__produto")
        .order_by("-criado_em")
    )
    serializer_class = PedidoVendaSerializer
    permission_classes = [IsAdminOrFuncionario]
    filterset_fields = ["status", "criado_por"]
    search_fields = [
        "cliente_nome",
        "cliente_documento",
        "id",
        "itens__variacao__produto__nome",
        "itens__variacao__produto__sku",
    ]
    ordering_fields = ["criado_em", "atualizado_em", "status"]

    def destroy(self, request, *args, **kwargs):
        pedido = self.get_object()
        if pedido.status != PedidoVenda.Status.RASCUNHO:
            raise ValidationError(
                {"detail": "Apenas pedidos em rascunho podem ser excluidos."}
            )

        return super().destroy(request, *args, **kwargs)
