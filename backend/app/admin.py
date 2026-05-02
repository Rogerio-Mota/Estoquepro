from django.contrib import admin

from .models import Fornecedor, Movimentacao, PedidoVenda, PedidoVendaItem, PerfilUsuario, Produto, Variacao


@admin.register(PerfilUsuario)
class PerfilUsuarioAdmin(admin.ModelAdmin):
    list_display = ("user", "tipo")
    list_filter = ("tipo",)
    search_fields = ("user__username",)


@admin.register(Fornecedor)
class FornecedorAdmin(admin.ModelAdmin):
    list_display = ("nome", "contato", "cidade")
    search_fields = ("nome", "contato", "cidade")


class VariacaoInline(admin.TabularInline):
    model = Variacao
    extra = 0


@admin.register(Produto)
class ProdutoAdmin(admin.ModelAdmin):
    list_display = (
        "nome",
        "marca",
        "categoria",
        "subcategoria",
        "sku",
        "estoque_minimo",
    )
    list_filter = ("categoria", "subcategoria")
    search_fields = ("nome", "marca", "sku")
    inlines = [VariacaoInline]


@admin.register(Variacao)
class VariacaoAdmin(admin.ModelAdmin):
    list_display = ("produto", "cor", "tamanho", "numeracao", "saldo_atual")
    list_filter = ("tamanho", "numeracao")
    search_fields = ("produto__nome", "produto__sku", "cor")


@admin.register(Movimentacao)
class MovimentacaoAdmin(admin.ModelAdmin):
    list_display = ("variacao", "tipo", "quantidade", "fornecedor", "responsavel", "data_referencia")
    list_filter = ("tipo", "data_referencia")
    search_fields = ("variacao__produto__nome", "variacao__produto__sku", "fornecedor__nome", "responsavel__username")


class PedidoVendaItemInline(admin.TabularInline):
    model = PedidoVendaItem
    extra = 0


@admin.register(PedidoVenda)
class PedidoVendaAdmin(admin.ModelAdmin):
    list_display = ("codigo", "cliente_nome", "criado_por", "criado_em")
    search_fields = ("cliente_nome",)
    inlines = [PedidoVendaItemInline]
