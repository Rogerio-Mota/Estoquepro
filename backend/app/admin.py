from django.contrib import admin

from .models import (
    ConfiguracaoSistema,
    Fornecedor,
    ImportacaoNotaFiscal,
    ImportacaoNotaFiscalItem,
    Movimentacao,
    PedidoVenda,
    PedidoVendaItem,
    PerfilUsuario,
    Produto,
    Variacao,
)


@admin.register(PerfilUsuario)
class PerfilUsuarioAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "tipo")
    list_select_related = ("user",)
    search_fields = ("user__username", "tipo")


class VariacaoInline(admin.TabularInline):
    model = Variacao
    extra = 1
    fields = ("cor", "tamanho", "numeracao", "saldo_atual")


@admin.register(Fornecedor)
class FornecedorAdmin(admin.ModelAdmin):
    list_display = ("id", "nome", "documento", "contato", "telefone", "email", "criado_em")
    search_fields = ("nome", "documento", "contato", "telefone", "email")
    ordering = ("nome",)


@admin.register(Produto)
class ProdutoAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "nome",
        "categoria",
        "subcategoria",
        "marca",
        "sku",
        "estoque_minimo",
        "estoque_total",
        "status_estoque",
    )
    search_fields = ("nome", "marca", "sku", "fornecedor__nome")
    list_filter = ("categoria", "subcategoria", "marca")
    list_select_related = ("fornecedor",)
    ordering = ("nome",)
    inlines = [VariacaoInline]

    def estoque_total(self, obj):
        return obj.estoque_total

    estoque_total.short_description = "Estoque Total"

    def status_estoque(self, obj):
        return "Baixo" if obj.estoque_baixo() else "OK"

    status_estoque.short_description = "Status"


@admin.register(Variacao)
class VariacaoAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "produto",
        "cor",
        "tamanho",
        "numeracao",
        "saldo_atual",
        "criado_em",
    )
    list_select_related = ("produto",)
    search_fields = ("produto__nome", "produto__marca", "produto__sku", "cor")
    list_filter = (
        "produto__categoria",
        "produto__subcategoria",
        "tamanho",
        "numeracao",
    )
    ordering = ("produto__nome",)


@admin.register(Movimentacao)
class MovimentacaoAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "get_produto",
        "get_marca",
        "get_cor",
        "get_tamanho",
        "get_numeracao",
        "tipo",
        "quantidade",
        "data",
    )
    date_hierarchy = "data"
    list_select_related = ("variacao", "variacao__produto")
    search_fields = (
        "variacao__produto__nome",
        "variacao__produto__marca",
        "variacao__produto__sku",
        "variacao__cor",
        "tipo",
    )
    list_filter = ("tipo", "data")
    ordering = ("-data",)
    readonly_fields = ("variacao", "tipo", "quantidade", "observacao", "data")

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def get_produto(self, obj):
        return obj.variacao.produto.nome

    get_produto.short_description = "Produto"

    def get_marca(self, obj):
        return obj.variacao.produto.marca

    get_marca.short_description = "Marca"

    def get_cor(self, obj):
        return obj.variacao.cor

    get_cor.short_description = "Cor"

    def get_tamanho(self, obj):
        return obj.variacao.tamanho

    get_tamanho.short_description = "Tamanho"

    def get_numeracao(self, obj):
        return obj.variacao.numeracao

    get_numeracao.short_description = "Numeracao"


class PedidoVendaItemInline(admin.TabularInline):
    model = PedidoVendaItem
    extra = 0
    readonly_fields = (
        "variacao",
        "quantidade",
        "preco_unitario",
        "movimentacao_saida",
        "movimentacao_estorno",
    )

    def has_add_permission(self, request, obj=None):
        return False

    def has_change_permission(self, request, obj=None):
        return False


@admin.register(PedidoVenda)
class PedidoVendaAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "codigo",
        "cliente_nome",
        "cliente_documento",
        "status",
        "criado_por",
        "criado_em",
    )
    search_fields = (
        "cliente_nome",
        "cliente_documento",
        "id",
        "itens__variacao__produto__nome",
        "itens__variacao__produto__sku",
    )
    list_filter = ("status", "criado_em")
    readonly_fields = (
        "codigo",
        "criado_por",
        "criado_em",
        "atualizado_em",
    )
    inlines = [PedidoVendaItemInline]

    def has_add_permission(self, request):
        return False


class ImportacaoNotaFiscalItemInline(admin.TabularInline):
    model = ImportacaoNotaFiscalItem
    extra = 0
    can_delete = False
    readonly_fields = (
        "indice",
        "codigo_produto",
        "descricao_produto",
        "quantidade",
        "valor_unitario",
        "variacao",
        "movimentacao",
    )


@admin.register(ImportacaoNotaFiscal)
class ImportacaoNotaFiscalAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "numero",
        "serie",
        "fornecedor_nome",
        "chave_acesso",
        "importado_por",
        "criado_em",
    )
    search_fields = (
        "numero",
        "serie",
        "fornecedor_nome",
        "fornecedor_documento",
        "chave_acesso",
    )
    list_filter = ("criado_em",)
    ordering = ("-criado_em",)
    readonly_fields = (
        "chave_acesso",
        "numero",
        "serie",
        "fornecedor_nome",
        "fornecedor_documento",
        "data_emissao",
        "arquivo_nome",
        "importado_por",
        "criado_em",
    )
    inlines = [ImportacaoNotaFiscalItemInline]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False


@admin.register(ConfiguracaoSistema)
class ConfiguracaoSistemaAdmin(admin.ModelAdmin):
    list_display = (
        "nome_empresa",
        "cor_primaria",
        "cor_secundaria",
        "cor_acento",
        "atualizado_por",
        "atualizado_em",
    )
    readonly_fields = ("atualizado_por", "atualizado_em")

    def has_add_permission(self, request):
        if ConfiguracaoSistema.objects.exists():
            return False
        return super().has_add_permission(request)
