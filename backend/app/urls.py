from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    FornecedorViewSet,
    ProdutoViewSet,
    VariacaoViewSet,
    MovimentacaoViewSet,
    PedidoVendaViewSet,
    UsuarioViewSet,
)
from .views import (
    ConfiguracaoSistemaView,
    EntradaEstoqueView,
    NotaFiscalImportacaoAplicarView,
    NotaFiscalImportacaoLimparView,
    NotaFiscalImportacaoPreviewView,
    PrimeiroAcessoView,
    RelatorioMensalView,
    RelatorioReposicaoView,
    SaidaEstoqueView,
    UsuarioLogadoView,
)

router = DefaultRouter()
router.register(r'fornecedores', FornecedorViewSet)
router.register(r'produtos', ProdutoViewSet)
router.register(r'variacoes', VariacaoViewSet)
router.register(r'movimentacoes', MovimentacaoViewSet)
router.register(r'pedidos', PedidoVendaViewSet)
router.register(r'usuarios', UsuarioViewSet)

urlpatterns = [
    path('primeiro-acesso/', PrimeiroAcessoView.as_view(), name='primeiro-acesso'),
    path(
        'configuracao-sistema/',
        ConfiguracaoSistemaView.as_view(),
        name='configuracao-sistema',
    ),
    path('entrada-estoque/', EntradaEstoqueView.as_view(), name='entrada-estoque'),
    path('saida-estoque/', SaidaEstoqueView.as_view(), name='saida-estoque'),
    path(
        'importacao-nota-fiscal/preview/',
        NotaFiscalImportacaoPreviewView.as_view(),
        name='importacao-nota-fiscal-preview',
    ),
    path(
        'importacao-nota-fiscal/aplicar/',
        NotaFiscalImportacaoAplicarView.as_view(),
        name='importacao-nota-fiscal-aplicar',
    ),
    path(
        'importacao-nota-fiscal/<int:importacao_id>/limpar/',
        NotaFiscalImportacaoLimparView.as_view(),
        name='importacao-nota-fiscal-limpar',
    ),
    path('relatorios/mensal/', RelatorioMensalView.as_view(), name='relatorio-mensal'),
    path('relatorios/reposicao/', RelatorioReposicaoView.as_view(), name='relatorio-reposicao'),
    path('', include(router.urls)),
    path('usuario-logado/', UsuarioLogadoView.as_view(), name='usuario-logado'),
]
