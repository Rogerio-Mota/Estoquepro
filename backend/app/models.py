from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone

SUBCATEGORIAS_POR_CATEGORIA = {
    "roupa": {"camisa", "calca", "bermuda"},
    "calcado": {"tenis"},
    "acessorio": {"cinto", "bijuteria"},
    "perfumaria": {"perfume"},
    "geral": {"geral"},
}
SUBCATEGORIAS_COM_TAMANHO = {"camisa", "calca", "bermuda", "cinto"}
SUBCATEGORIAS_COM_TAMANHO_UNICO = {"bijuteria", "perfume"}
SUBCATEGORIAS_COM_NUMERACAO = {"tenis"}
TAMANHOS_PADRAO = {"PP", "P", "M", "G", "GG"}
TAMANHOS_CINTO = {"P", "M", "G", "GG"}


class PerfilUsuario(models.Model):
    class Tipo(models.TextChoices):
        ADMIN = "admin", "Administrador"
        FUNCIONARIO = "funcionario", "Funcionário"

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="perfil")
    tipo = models.CharField(
        max_length=20,
        choices=Tipo.choices,
        default=Tipo.FUNCIONARIO,
    )

    class Meta:
        ordering = ("user__username",)
        verbose_name = "perfil de usuário"
        verbose_name_plural = "perfis de usuário"

    def __str__(self):
        return f"{self.user.username} ({self.get_tipo_display()})"


class Fornecedor(models.Model):
    nome = models.CharField(max_length=100)
    contato = models.CharField(max_length=100, blank=True, default="")
    cidade = models.CharField(max_length=100, blank=True, default="")
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("nome",)
        verbose_name = "fornecedor"
        verbose_name_plural = "fornecedores"

    def __str__(self):
        return self.nome


class Produto(models.Model):
    class Categoria(models.TextChoices):
        ROUPA = "roupa", "Roupa"
        CALCADO = "calcado", "Calçado"
        ACESSORIO = "acessorio", "Acessório"
        PERFUMARIA = "perfumaria", "Perfumaria"
        GERAL = "geral", "Geral"

    class Subcategoria(models.TextChoices):
        CAMISA = "camisa", "Camisa"
        CALCA = "calca", "Calça"
        BERMUDA = "bermuda", "Bermuda"
        TENIS = "tenis", "Tênis"
        CINTO = "cinto", "Cinto"
        BIJUTERIA = "bijuteria", "Bijuteria Masculina"
        PERFUME = "perfume", "Perfume"
        GERAL = "geral", "Geral"

    nome = models.CharField(max_length=100)
    categoria = models.CharField(max_length=20, choices=Categoria.choices)
    subcategoria = models.CharField(max_length=20, choices=Subcategoria.choices)
    marca = models.CharField(max_length=100)
    sku = models.CharField(max_length=50, unique=True)
    fornecedor = models.ForeignKey(
        Fornecedor,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="produtos",
    )
    preco_custo = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
    )
    preco_venda = models.DecimalField(max_digits=10, decimal_places=2)
    estoque_minimo = models.PositiveIntegerField(default=0)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("nome",)
        verbose_name = "produto"
        verbose_name_plural = "produtos"

    def __str__(self):
        return f"{self.nome} - {self.marca}"

    @property
    def estoque_total(self):
        return sum(variacao.saldo_atual for variacao in self.variacoes.all())

    def estoque_baixo(self):
        return self.estoque_total <= self.estoque_minimo

    def clean(self):
        super().clean()

        self.nome = " ".join(str(self.nome or "").split())
        self.marca = " ".join(str(self.marca or "").split())
        self.sku = str(self.sku or "").strip().upper()

        subcategorias_validas = SUBCATEGORIAS_POR_CATEGORIA.get(self.categoria, set())
        if self.subcategoria and self.subcategoria not in subcategorias_validas:
            raise ValidationError(
                {
                    "subcategoria": (
                        "A subcategoria selecionada não pertence à categoria informada."
                    )
                }
            )

        if self.preco_custo is not None and self.preco_custo < 0:
            raise ValidationError(
                {"preco_custo": "O preço de custo não pode ser negativo."}
            )

        if self.preco_venda is not None and self.preco_venda <= 0:
            raise ValidationError(
                {"preco_venda": "O preço de venda deve ser maior que zero."}
            )

        if (
            self.preco_custo is not None
            and self.preco_venda is not None
            and self.preco_venda < self.preco_custo
        ):
            raise ValidationError(
                {"preco_venda": "O preço de venda não pode ser menor que o preço de custo."}
            )

        sku_duplicado = (
            Produto.objects.filter(sku__iexact=self.sku).exclude(pk=self.pk).exists()
        )
        if sku_duplicado:
            raise ValidationError(
                {"sku": "Já existe um produto cadastrado com este SKU."}
            )

        produto_duplicado = (
            Produto.objects.filter(
                nome__iexact=self.nome,
                marca__iexact=self.marca,
                categoria=self.categoria,
                subcategoria=self.subcategoria,
            )
            .exclude(pk=self.pk)
            .exists()
        )
        if produto_duplicado:
            raise ValidationError(
                {
                    "nome": (
                        "Já existe um produto cadastrado com o mesmo nome, marca, "
                        "categoria e subcategoria."
                    )
                }
            )

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)

class Variacao(models.Model):
    class Tamanho(models.TextChoices):
        PP = "PP", "PP"
        P = "P", "P"
        M = "M", "M"
        G = "G", "G"
        GG = "GG", "GG"
        U = "U", "Único"

    class Numeracao(models.TextChoices):
        N36 = "36", "36"
        N37 = "37", "37"
        N38 = "38", "38"
        N39 = "39", "39"
        N40 = "40", "40"
        N41 = "41", "41"
        N42 = "42", "42"
        N43 = "43", "43"
        N44 = "44", "44"
        N45 = "45", "45"
        N46 = "46", "46"

    produto = models.ForeignKey(
        Produto,
        on_delete=models.CASCADE,
        related_name="variacoes",
    )
    cor = models.CharField(max_length=50, blank=True, null=True)
    tamanho = models.CharField(
        max_length=2,
        choices=Tamanho.choices,
        blank=True,
        null=True,
    )
    numeracao = models.CharField(
        max_length=2,
        choices=Numeracao.choices,
        blank=True,
        null=True,
    )
    saldo_atual = models.IntegerField(default=0)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("produto__nome", "cor", "tamanho", "numeracao")
        verbose_name = "variação"
        verbose_name_plural = "variações"

    def __str__(self):
        detalhes = [self.produto.nome]

        if self.cor:
            detalhes.append(self.cor)
        if self.tamanho:
            detalhes.append(f"Tamanho {self.tamanho}")
        if self.numeracao:
            detalhes.append(f"Numeração {self.numeracao}")

        return " - ".join(detalhes)

    def clean(self):
        super().clean()

        if self.saldo_atual < 0:
            raise ValidationError({"saldo_atual": "O saldo atual não pode ser negativo."})

        if not self.produto_id:
            return

        subcategoria = self.produto.subcategoria

        if subcategoria in SUBCATEGORIAS_COM_TAMANHO:
            if not self.tamanho:
                raise ValidationError({"tamanho": "Esta variação exige um tamanho."})
            if self.numeracao:
                raise ValidationError(
                    {"numeracao": "Esta variação não deve usar numeração."}
                )

        elif subcategoria in SUBCATEGORIAS_COM_NUMERACAO:
            if not self.numeracao:
                raise ValidationError(
                    {"numeracao": "Esta variação exige uma numeração."}
                )
            if self.tamanho:
                raise ValidationError({"tamanho": "Esta variação não deve usar tamanho."})

        elif subcategoria in SUBCATEGORIAS_COM_TAMANHO_UNICO:
            if self.tamanho and self.tamanho != self.Tamanho.U:
                raise ValidationError(
                    {"tamanho": "Use tamanho único ou deixe o campo em branco."}
                )
            if self.numeracao:
                raise ValidationError(
                    {"numeracao": "Esta variação não deve usar numeração."}
                )

        if subcategoria in {
            Produto.Subcategoria.CAMISA,
            Produto.Subcategoria.CALCA,
            Produto.Subcategoria.BERMUDA,
        } and self.tamanho and self.tamanho not in TAMANHOS_PADRAO:
            raise ValidationError(
                {"tamanho": "Tamanho inválido para a subcategoria selecionada."}
            )

        if (
            subcategoria == Produto.Subcategoria.CINTO
            and self.tamanho
            and self.tamanho not in TAMANHOS_CINTO
        ):
            raise ValidationError({"tamanho": "Tamanho inválido para cintos."})

        duplicada = (
            Variacao.objects.filter(
                produto=self.produto,
                cor=self.cor,
                tamanho=self.tamanho,
                numeracao=self.numeracao,
            )
            .exclude(pk=self.pk)
            .exists()
        )
        if duplicada:
            raise ValidationError(
                {
                    "produto": (
                        "Já existe uma variação cadastrada com a mesma combinação "
                        "de cor, tamanho e numeração."
                    )
                }
            )

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)


class PedidoVenda(models.Model):
    class Status(models.TextChoices):
        FINALIZADO = "finalizado", "Finalizado"

    cliente_nome = models.CharField(max_length=120)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.FINALIZADO,
    )
    criado_por = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        related_name="pedidos_venda_criados",
        blank=True,
        null=True,
    )
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-criado_em", "-id")
        verbose_name = "venda"
        verbose_name_plural = "vendas"

    def __str__(self):
        return self.codigo

    @property
    def codigo(self):
        return f"VEN-{self.pk:05d}" if self.pk else "VEN-NOVA"

    @property
    def valor_total(self):
        return sum(item.subtotal for item in self.itens.all())

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)


class Movimentacao(models.Model):
    class Tipo(models.TextChoices):
        ENTRADA = "entrada", "Entrada"
        SAIDA = "saida", "Saída"

    variacao = models.ForeignKey(
        Variacao,
        on_delete=models.CASCADE,
        related_name="movimentacoes",
    )
    tipo = models.CharField(max_length=10, choices=Tipo.choices)
    quantidade = models.PositiveIntegerField()
    observacao = models.TextField(blank=True, null=True)
    fornecedor = models.ForeignKey(
        Fornecedor,
        on_delete=models.SET_NULL,
        related_name="movimentacoes",
        blank=True,
        null=True,
    )
    responsavel = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        related_name="movimentacoes_realizadas",
        blank=True,
        null=True,
    )
    data_referencia = models.DateField(default=timezone.localdate)
    data = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-data", "-id")
        verbose_name = "movimentação"
        verbose_name_plural = "movimentações"

    def __str__(self):
        return f"{self.get_tipo_display()} - {self.quantidade} - {self.variacao}"

    def clean(self):
        super().clean()

        if self.quantidade < 1:
            raise ValidationError(
                {"quantidade": "A quantidade da movimentação deve ser maior que zero."}
            )

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)


class PedidoVendaItem(models.Model):
    pedido = models.ForeignKey(
        PedidoVenda,
        on_delete=models.CASCADE,
        related_name="itens",
    )
    variacao = models.ForeignKey(
        Variacao,
        on_delete=models.PROTECT,
        related_name="itens_pedido_venda",
    )
    quantidade = models.PositiveIntegerField()
    preco_unitario = models.DecimalField(max_digits=10, decimal_places=2)
    movimentacao_saida = models.ForeignKey(
        Movimentacao,
        on_delete=models.SET_NULL,
        related_name="itens_pedido_venda_saida",
        blank=True,
        null=True,
    )

    class Meta:
        ordering = ("id",)
        unique_together = ("pedido", "variacao")
        verbose_name = "item do pedido de venda"
        verbose_name_plural = "itens do pedido de venda"

    def __str__(self):
        return f"{self.pedido.codigo} - {self.variacao}"

    @property
    def subtotal(self):
        return self.quantidade * self.preco_unitario

    def clean(self):
        super().clean()

        if self.quantidade < 1:
            raise ValidationError(
                {"quantidade": "A quantidade do item deve ser maior que zero."}
            )

        if self.preco_unitario < 0:
            raise ValidationError(
                {"preco_unitario": "O preço unitário não pode ser negativo."}
            )

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)
