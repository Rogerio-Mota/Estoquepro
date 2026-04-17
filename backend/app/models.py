from django.contrib.auth.models import User
from django.core.validators import FileExtensionValidator
from django.core.exceptions import ValidationError
from django.db import models

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
        FUNCIONARIO = "funcionario", "Funcionario"

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="perfil")
    tipo = models.CharField(
        max_length=20,
        choices=Tipo.choices,
        default=Tipo.FUNCIONARIO,
    )

    class Meta:
        ordering = ("user__username",)
        verbose_name = "perfil de usuario"
        verbose_name_plural = "perfis de usuario"

    def __str__(self):
        return f"{self.user.username} ({self.get_tipo_display()})"


class Fornecedor(models.Model):
    nome = models.CharField(max_length=100)
    documento = models.CharField(max_length=18, blank=True, null=True)
    contato = models.CharField(max_length=100, blank=True, null=True)
    telefone = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("nome",)
        verbose_name = "fornecedor"
        verbose_name_plural = "fornecedores"

    def __str__(self):
        return self.nome

    def clean(self):
        super().clean()

        if self.documento:
            digits = "".join(char for char in self.documento if char.isdigit())
            if len(digits) not in {11, 14}:
                raise ValidationError(
                    {"documento": "Informe um CPF ou CNPJ valido para o fornecedor."}
                )


class Produto(models.Model):
    class Categoria(models.TextChoices):
        ROUPA = "roupa", "Roupa"
        CALCADO = "calcado", "Calcado"
        ACESSORIO = "acessorio", "Acessorio"
        PERFUMARIA = "perfumaria", "Perfumaria"
        GERAL = "geral", "Geral"

    class Subcategoria(models.TextChoices):
        CAMISA = "camisa", "Camisa"
        CALCA = "calca", "Calca"
        BERMUDA = "bermuda", "Bermuda"
        TENIS = "tenis", "Tenis"
        CINTO = "cinto", "Cinto"
        BIJUTERIA = "bijuteria", "Bijuteria Masculina"
        PERFUME = "perfume", "Perfume"
        GERAL = "geral", "Geral"

    nome = models.CharField(max_length=100)
    categoria = models.CharField(max_length=20, choices=Categoria.choices)
    subcategoria = models.CharField(max_length=20, choices=Subcategoria.choices)
    marca = models.CharField(max_length=100)
    sku = models.CharField(max_length=50, unique=True)
    codigo_barras = models.CharField(max_length=20, blank=True, null=True)
    ncm = models.CharField(max_length=8, blank=True, null=True)
    cest = models.CharField(max_length=7, blank=True, null=True)
    cfop = models.CharField(max_length=4, blank=True, null=True)
    unidade_comercial = models.CharField(max_length=10, blank=True, null=True)
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
        self.codigo_barras = str(self.codigo_barras or "").strip() or None
        self.ncm = str(self.ncm or "").strip() or None
        self.cest = str(self.cest or "").strip() or None
        self.cfop = str(self.cfop or "").strip() or None
        self.unidade_comercial = str(self.unidade_comercial or "").strip().upper() or None

        subcategorias_validas = SUBCATEGORIAS_POR_CATEGORIA.get(self.categoria, set())
        if self.subcategoria and self.subcategoria not in subcategorias_validas:
            raise ValidationError(
                {
                    "subcategoria": (
                        "A subcategoria selecionada nÃ£o pertence Ã  categoria informada."
                    )
                }
            )

        if self.preco_custo is not None and self.preco_custo < 0:
            raise ValidationError(
                {"preco_custo": "O preÃ§o de custo nÃ£o pode ser negativo."}
            )

        if self.preco_venda is not None and self.preco_venda <= 0:
            raise ValidationError(
                {"preco_venda": "O preco de venda deve ser maior que zero."}
            )

        if (
            self.preco_custo is not None
            and self.preco_venda is not None
            and self.preco_venda < self.preco_custo
        ):
            raise ValidationError(
                {"preco_venda": "O preÃ§o de venda nÃ£o pode ser menor que o preÃ§o de custo."}
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
        U = "U", "Unico"

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
        verbose_name = "variacao"
        verbose_name_plural = "variacoes"

    def __str__(self):
        detalhes = [self.produto.nome]

        if self.cor:
            detalhes.append(self.cor)
        if self.tamanho:
            detalhes.append(f"Tamanho {self.tamanho}")
        if self.numeracao:
            detalhes.append(f"NumeraÃ§Ã£o {self.numeracao}")

        return " - ".join(detalhes)

    def clean(self):
        super().clean()

        if self.saldo_atual < 0:
            raise ValidationError({"saldo_atual": "O saldo atual nÃ£o pode ser negativo."})

        if not self.produto_id:
            return

        subcategoria = self.produto.subcategoria

        if subcategoria in SUBCATEGORIAS_COM_TAMANHO:
            if not self.tamanho:
                raise ValidationError({"tamanho": "Esta variaÃ§Ã£o exige um tamanho."})
            if self.numeracao:
                raise ValidationError(
                    {"numeracao": "Esta variaÃ§Ã£o nÃ£o deve usar numeraÃ§Ã£o."}
                )

        elif subcategoria in SUBCATEGORIAS_COM_NUMERACAO:
            if not self.numeracao:
                raise ValidationError(
                    {"numeracao": "Esta variaÃ§Ã£o exige uma numeraÃ§Ã£o."}
                )
            if self.tamanho:
                raise ValidationError({"tamanho": "Esta variaÃ§Ã£o nÃ£o deve usar tamanho."})

        elif subcategoria in SUBCATEGORIAS_COM_TAMANHO_UNICO:
            if self.tamanho and self.tamanho != self.Tamanho.U:
                raise ValidationError(
                    {"tamanho": "Use tamanho Ãºnico ou deixe o campo em branco."}
                )
            if self.numeracao:
                raise ValidationError(
                    {"numeracao": "Esta variaÃ§Ã£o nÃ£o deve usar numeraÃ§Ã£o."}
                )

        if subcategoria in {
            Produto.Subcategoria.CAMISA,
            Produto.Subcategoria.CALCA,
            Produto.Subcategoria.BERMUDA,
        } and self.tamanho and self.tamanho not in TAMANHOS_PADRAO:
            raise ValidationError(
                {"tamanho": "Tamanho invÃ¡lido para a subcategoria selecionada."}
            )

        if (
            subcategoria == Produto.Subcategoria.CINTO
            and self.tamanho
            and self.tamanho not in TAMANHOS_CINTO
        ):
            raise ValidationError({"tamanho": "Tamanho invÃ¡lido para cintos."})

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
                        "JÃ¡ existe uma variaÃ§Ã£o cadastrada com a mesma combinaÃ§Ã£o "
                        "de cor, tamanho e numeraÃ§Ã£o."
                    )
                }
            )

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)


class PedidoVenda(models.Model):
    class Status(models.TextChoices):
        RASCUNHO = "rascunho", "Rascunho"
        FINALIZADO = "finalizado", "Finalizado"
        CANCELADO = "cancelado", "Cancelado"

    cliente_nome = models.CharField(max_length=120)
    cliente_documento = models.CharField(max_length=18, blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.RASCUNHO,
    )
    observacao = models.TextField(blank=True, null=True)
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
        verbose_name = "pedido de venda"
        verbose_name_plural = "pedidos de venda"

    def __str__(self):
        return self.codigo

    @property
    def codigo(self):
        return f"PED-{self.pk:05d}" if self.pk else "PED-NOVO"

    @property
    def valor_total(self):
        return sum(item.subtotal for item in self.itens.all())

    def clean(self):
        super().clean()

        if self.cliente_documento:
            digits = "".join(char for char in self.cliente_documento if char.isdigit())
            if len(digits) not in {11, 14}:
                raise ValidationError(
                    {"cliente_documento": "Informe um CPF ou CNPJ valido para o cliente."}
                )

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)


class Movimentacao(models.Model):
    class Tipo(models.TextChoices):
        ENTRADA = "entrada", "Entrada"
        SAIDA = "saida", "Saida"

    variacao = models.ForeignKey(
        Variacao,
        on_delete=models.CASCADE,
        related_name="movimentacoes",
    )
    tipo = models.CharField(max_length=10, choices=Tipo.choices)
    quantidade = models.PositiveIntegerField()
    observacao = models.TextField(blank=True, null=True)
    responsavel = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        related_name="movimentacoes_realizadas",
        blank=True,
        null=True,
    )
    data = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-data", "-id")
        verbose_name = "movimentacao"
        verbose_name_plural = "movimentacoes"

    def __str__(self):
        return f"{self.get_tipo_display()} - {self.quantidade} - {self.variacao}"

    def clean(self):
        super().clean()

        if self.quantidade < 1:
            raise ValidationError(
                {"quantidade": "A quantidade da movimentaÃ§Ã£o deve ser maior que zero."}
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
    movimentacao_estorno = models.ForeignKey(
        Movimentacao,
        on_delete=models.SET_NULL,
        related_name="itens_pedido_venda_estorno",
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
                {"preco_unitario": "O preÃ§o unitÃ¡rio nÃ£o pode ser negativo."}
            )

    def save(self, *args, **kwargs):
        self.full_clean()
        return super().save(*args, **kwargs)


class ImportacaoNotaFiscal(models.Model):
    chave_acesso = models.CharField(
        max_length=44,
        unique=True,
        blank=True,
        null=True,
    )
    numero = models.CharField(max_length=20, blank=True)
    serie = models.CharField(max_length=10, blank=True)
    fornecedor_nome = models.CharField(max_length=150, blank=True)
    fornecedor_documento = models.CharField(max_length=18, blank=True)
    data_emissao = models.DateTimeField(blank=True, null=True)
    arquivo_nome = models.CharField(max_length=255, blank=True)
    importado_por = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        related_name="importacoes_nota_fiscal",
        blank=True,
        null=True,
    )
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-criado_em", "-id")
        verbose_name = "importacao de nota fiscal"
        verbose_name_plural = "importacoes de nota fiscal"

    def __str__(self):
        identificador = self.chave_acesso or f"{self.numero}/{self.serie}"
        return f"NF-e {identificador}"


class ImportacaoNotaFiscalItem(models.Model):
    importacao = models.ForeignKey(
        ImportacaoNotaFiscal,
        on_delete=models.CASCADE,
        related_name="itens",
    )
    indice = models.PositiveIntegerField()
    codigo_produto = models.CharField(max_length=60, blank=True)
    descricao_produto = models.CharField(max_length=255)
    quantidade = models.DecimalField(max_digits=12, decimal_places=4)
    valor_unitario = models.DecimalField(
        max_digits=12,
        decimal_places=4,
        blank=True,
        null=True,
    )
    variacao = models.ForeignKey(
        Variacao,
        on_delete=models.SET_NULL,
        related_name="itens_importacao_nota_fiscal",
        blank=True,
        null=True,
    )
    movimentacao = models.ForeignKey(
        Movimentacao,
        on_delete=models.SET_NULL,
        related_name="itens_importacao_nota_fiscal",
        blank=True,
        null=True,
    )

    class Meta:
        ordering = ("indice", "id")
        unique_together = ("importacao", "indice")
        verbose_name = "item de importacao de nota fiscal"
        verbose_name_plural = "itens de importacao de nota fiscal"

    def __str__(self):
        return f"Item {self.indice} - {self.descricao_produto}"


class ConfiguracaoSistema(models.Model):
    nome_empresa = models.CharField(max_length=120, default="EstoquePro")
    descricao_empresa = models.CharField(
        max_length=160,
        default="Gestao inteligente de estoque",
    )
    logo = models.FileField(
        upload_to="branding/logos/",
        blank=True,
        null=True,
        validators=[
            FileExtensionValidator(
                allowed_extensions=["png", "jpg", "jpeg", "webp", "svg"]
            )
        ],
    )
    cor_primaria = models.CharField(max_length=7, default="#1768AC")
    cor_secundaria = models.CharField(max_length=7, default="#0F4C81")
    cor_acento = models.CharField(max_length=7, default="#F97316")
    atualizado_por = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        related_name="configuracoes_sistema_atualizadas",
        blank=True,
        null=True,
    )
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "configuracao do sistema"
        verbose_name_plural = "configuracoes do sistema"

    def __str__(self):
        return self.nome_empresa

    def clean(self):
        super().clean()

        for field_name in ("cor_primaria", "cor_secundaria", "cor_acento"):
            value = (getattr(self, field_name) or "").strip()
            if len(value) != 7 or not value.startswith("#"):
                raise ValidationError(
                    {field_name: "Informe uma cor hexadecimal no formato #RRGGBB."}
                )

            try:
                int(value[1:], 16)
            except ValueError as error:
                raise ValidationError(
                    {field_name: "Informe uma cor hexadecimal vÃ¡lida."}
                ) from error

    def save(self, *args, **kwargs):
        self.pk = 1
        self.full_clean()
        return super().save(*args, **kwargs)