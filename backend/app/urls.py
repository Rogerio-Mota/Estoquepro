from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    EntradaEstoqueView,
    FornecedorViewSet,
    MovimentacaoViewSet,
    PedidoVendaViewSet,
    PrimeiroAcessoView,
    ProdutoViewSet,
    RelatorioVendasView,
    SaidaEstoqueView,
    UsuarioLogadoView,
    UsuarioViewSet,
    VariacaoViewSet,
)

router = DefaultRouter()
router.register(r"fornecedores", FornecedorViewSet)
router.register(r"produtos", ProdutoViewSet)
router.register(r"variacoes", VariacaoViewSet)
router.register(r"movimentacoes", MovimentacaoViewSet)
router.register(r"pedidos", PedidoVendaViewSet)
router.register(r"usuarios", UsuarioViewSet)

urlpatterns = [
    path("primeiro-acesso/", PrimeiroAcessoView.as_view(), name="primeiro-acesso"),
    path("entrada-estoque/", EntradaEstoqueView.as_view(), name="entrada-estoque"),
    path("saida-estoque/", SaidaEstoqueView.as_view(), name="saida-estoque"),
    path("relatorios/vendas/", RelatorioVendasView.as_view(), name="relatorio-vendas"),
    path("", include(router.urls)),
    path("usuario-logado/", UsuarioLogadoView.as_view(), name="usuario-logado"),
]
