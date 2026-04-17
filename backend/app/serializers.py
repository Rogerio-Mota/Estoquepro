import json

from django.contrib.auth.models import User
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from .models import (
    ConfiguracaoSistema,
    Fornecedor,
    ImportacaoNotaFiscal,
    Movimentacao,
    PedidoVenda,
    PedidoVendaItem,
    PerfilUsuario,
    Produto,
    Variacao,
)


def _raise_drf_validation(error):
    if hasattr(error, "message_dict"):
        raise serializers.ValidationError(error.message_dict)
    raise serializers.ValidationError(error.messages)


def _validate_model_instance(instance):
    try:
        instance.full_clean()
    except DjangoValidationError as error:
        _raise_drf_validation(error)
    return instance


class UsuarioSerializer(serializers.ModelSerializer):
    tipo = serializers.ChoiceField(choices=PerfilUsuario.Tipo.choices, source="perfil.tipo")
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ["id", "username", "password", "tipo"]

    def validate(self, attrs):
        if self.instance is None and not attrs.get("password"):
            raise serializers.ValidationError(
                {"password": "A senha é obrigatória para criar um usuário."}
            )
        return attrs

    def create(self, validated_data):
        perfil_data = validated_data.pop("perfil", {})
        password = validated_data.pop("password")
        tipo = perfil_data.get("tipo", PerfilUsuario.Tipo.FUNCIONARIO)

        user = User.objects.create_user(password=password, **validated_data)
        PerfilUsuario.objects.update_or_create(
            user=user,
            defaults={"tipo": tipo},
        )
        return user

    def update(self, instance, validated_data):
        perfil_data = validated_data.pop("perfil", None)
        password = validated_data.pop("password", None)

        instance.username = validated_data.get("username", instance.username)
        if password:
            instance.set_password(password)
        instance.save()

        if perfil_data:
            PerfilUsuario.objects.update_or_create(
                user=instance,
                defaults={"tipo": perfil_data.get("tipo", instance.perfil.tipo)},
            )

        return instance


class PrimeiroAcessoSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True, min_length=6)
    password_confirmacao = serializers.CharField(write_only=True, min_length=6)

    def validate_username(self, value):
        username = str(value or "").strip()
        if not username:
            raise serializers.ValidationError("Informe um nome de usuario.")

        if User.objects.filter(username__iexact=username).exists():
            raise serializers.ValidationError("Ja existe um usuario com esse nome.")

        return username

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirmacao"]:
            raise serializers.ValidationError(
                {"password_confirmacao": "As senhas informadas nao coincidem."}
            )

        return attrs


class UsuarioLogadoSerializer(serializers.ModelSerializer):
    tipo = serializers.CharField(source="perfil.tipo", read_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "tipo"]


class FornecedorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Fornecedor
        fields = [
            "id",
            "nome",
            "documento",
            "contato",
            "telefone",
            "email",
            "criado_em",
        ]


class VariacaoSerializer(serializers.ModelSerializer):
    produto_nome = serializers.ReadOnlyField(source="produto.nome")
    produto_sku = serializers.ReadOnlyField(source="produto.sku")
    estoque_inicial = serializers.IntegerField(
        write_only=True,
        required=False,
        min_value=0,
        default=0,
    )

    class Meta:
        model = Variacao
        fields = [
            "id",
            "produto",
            "produto_nome",
            "produto_sku",
            "cor",
            "tamanho",
            "numeracao",
            "saldo_atual",
            "estoque_inicial",
            "criado_em",
        ]
        read_only_fields = ["id", "produto_nome", "produto_sku", "saldo_atual", "criado_em"]

    def validate(self, attrs):
        if self.instance is not None and "estoque_inicial" in attrs:
            raise serializers.ValidationError(
                {
                    "estoque_inicial": (
                        "Use uma movimentacao para ajustar o estoque de uma variacao existente."
                    )
                }
            )

        instance = self.instance or Variacao()
        for field, value in attrs.items():
            if field == "estoque_inicial":
                continue
            setattr(instance, field, value)
        _validate_model_instance(instance)
        return attrs

    def create(self, validated_data):
        from .services import criar_variacao_com_estoque_inicial

        estoque_inicial = validated_data.pop("estoque_inicial", 0)
        produto = validated_data.pop("produto")
        usuario = self.context.get("request").user if self.context.get("request") else None
        return criar_variacao_com_estoque_inicial(
            produto=produto,
            estoque_inicial=estoque_inicial,
            observacao=f"Entrada inicial automatica do cadastro - {produto.nome}",
            usuario=usuario,
            **validated_data,
        )


class ProdutoSerializer(serializers.ModelSerializer):
    fornecedor_nome = serializers.ReadOnlyField(source="fornecedor.nome")
    variacoes = VariacaoSerializer(many=True, read_only=True)
    estoque_total = serializers.SerializerMethodField()
    status_estoque = serializers.SerializerMethodField()

    class Meta:
        model = Produto
        fields = [
            "id",
            "nome",
            "categoria",
            "subcategoria",
            "marca",
            "sku",
            "codigo_barras",
            "ncm",
            "cest",
            "cfop",
            "unidade_comercial",
            "fornecedor",
            "fornecedor_nome",
            "preco_custo",
            "preco_venda",
            "estoque_minimo",
            "criado_em",
            "variacoes",
            "estoque_total",
            "status_estoque",
        ]

    def get_estoque_total(self, obj):
        return getattr(obj, "estoque_total_calculado", obj.estoque_total)

    def get_status_estoque(self, obj):
        return "baixo" if obj.estoque_baixo() else "ok"

    def validate(self, attrs):
        instance = self.instance or Produto()
        for field, value in attrs.items():
            setattr(instance, field, value)
        _validate_model_instance(instance)
        return attrs


class MovimentacaoSerializer(serializers.ModelSerializer):
    produto_nome = serializers.ReadOnlyField(source="variacao.produto.nome")
    marca = serializers.ReadOnlyField(source="variacao.produto.marca")
    cor = serializers.ReadOnlyField(source="variacao.cor")
    tamanho = serializers.ReadOnlyField(source="variacao.tamanho")
    numeracao = serializers.ReadOnlyField(source="variacao.numeracao")
    responsavel_username = serializers.ReadOnlyField(source="responsavel.username")
    responsavel_tipo = serializers.ReadOnlyField(source="responsavel.perfil.tipo")

    class Meta:
        model = Movimentacao
        fields = [
            "id",
            "variacao",
            "produto_nome",
            "marca",
            "cor",
            "tamanho",
            "numeracao",
            "tipo",
            "quantidade",
            "observacao",
            "responsavel",
            "responsavel_username",
            "responsavel_tipo",
            "data",
        ]


class MovimentacaoEstoqueSerializer(serializers.Serializer):
    variacao = serializers.PrimaryKeyRelatedField(
        queryset=Variacao.objects.select_related("produto").all()
    )
    quantidade = serializers.IntegerField(min_value=1)
    observacao = serializers.CharField(required=False, allow_blank=True, allow_null=True)


class EntradaEstoqueSerializer(MovimentacaoEstoqueSerializer):
    pass


class SaidaEstoqueSerializer(MovimentacaoEstoqueSerializer):
    pass


class NotaFiscalImportacaoPreviewSerializer(serializers.Serializer):
    arquivo = serializers.FileField()


class NotaFiscalImportacaoFornecedorResolverSerializer(serializers.Serializer):
    modo = serializers.ChoiceField(choices=["manter", "usar_existente", "criar"])
    fornecedor = serializers.PrimaryKeyRelatedField(
        queryset=Fornecedor.objects.all(),
        required=False,
        allow_null=True,
    )
    nome = serializers.CharField(required=False, allow_blank=True)
    documento = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    contato = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    telefone = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)

    def validate(self, attrs):
        modo = attrs["modo"]

        if modo == "usar_existente" and not attrs.get("fornecedor"):
            raise serializers.ValidationError(
                {"fornecedor": "Selecione um fornecedor existente para vincular a importacao."}
            )

        if modo == "criar" and not (attrs.get("nome") or "").strip():
            raise serializers.ValidationError(
                {"nome": "Informe o nome do fornecedor para concluir o cadastro."}
            )

        return attrs


class NotaFiscalImportacaoNovaVariacaoSerializer(serializers.Serializer):
    produto = serializers.PrimaryKeyRelatedField(queryset=Produto.objects.all())
    cor = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    tamanho = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    numeracao = serializers.CharField(required=False, allow_blank=True, allow_null=True)


class NotaFiscalImportacaoNovoProdutoSerializer(serializers.Serializer):
    nome = serializers.CharField()
    marca = serializers.CharField()
    categoria = serializers.CharField()
    subcategoria = serializers.CharField()
    sku = serializers.CharField()
    codigo_barras = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    ncm = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    cest = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    cfop = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    unidade_comercial = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
    )
    preco_custo = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        required=False,
        allow_null=True,
    )
    preco_venda = serializers.DecimalField(max_digits=10, decimal_places=2)
    estoque_minimo = serializers.IntegerField(required=False, min_value=0, default=0)
    fornecedor = serializers.PrimaryKeyRelatedField(
        queryset=Fornecedor.objects.all(),
        required=False,
        allow_null=True,
    )
    cor = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    tamanho = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    numeracao = serializers.CharField(required=False, allow_blank=True, allow_null=True)


class NotaFiscalImportacaoMapeamentoItemSerializer(serializers.Serializer):
    indice = serializers.IntegerField(min_value=1)
    variacao = serializers.PrimaryKeyRelatedField(
        queryset=Variacao.objects.select_related("produto").all(),
        required=False,
        allow_null=True,
    )
    nova_variacao = NotaFiscalImportacaoNovaVariacaoSerializer(
        required=False,
        allow_null=True,
    )
    novo_produto = NotaFiscalImportacaoNovoProdutoSerializer(
        required=False,
        allow_null=True,
    )

    def validate(self, attrs):
        resolucoes = [
            attrs.get("variacao"),
            attrs.get("nova_variacao"),
            attrs.get("novo_produto"),
        ]
        resolucoes_preenchidas = [item for item in resolucoes if item]

        if len(resolucoes_preenchidas) != 1:
            raise serializers.ValidationError(
                (
                    "Cada item da nota deve usar exatamente uma resolução: "
                    "variação existente, nova variação ou novo produto."
                )
            )

        return attrs


class NotaFiscalImportacaoAplicarSerializer(serializers.Serializer):
    arquivo = serializers.FileField()
    fornecedor = serializers.CharField(required=False, allow_blank=True, default="")
    mapeamentos = serializers.CharField()

    def validate_mapeamentos(self, value):
        payload = self._parse_json_payload(
            value,
            fallback_message="Não foi possível interpretar os mapeamentos dos itens.",
        )
        if not isinstance(payload, list):
            raise serializers.ValidationError(
                "Os mapeamentos devem ser enviados em formato de lista."
            )

        serializer = NotaFiscalImportacaoMapeamentoItemSerializer(data=payload, many=True)
        serializer.is_valid(raise_exception=True)
        return serializer.validated_data

    def validate_fornecedor(self, value):
        if not value:
            return {"modo": "manter"}

        payload = self._parse_json_payload(
            value,
            fallback_message="Não foi possível interpretar os dados do fornecedor.",
        )
        if not isinstance(payload, dict):
            raise serializers.ValidationError(
                "Os dados do fornecedor devem ser enviados em formato de objeto."
            )

        serializer = NotaFiscalImportacaoFornecedorResolverSerializer(data=payload)
        serializer.is_valid(raise_exception=True)
        return serializer.validated_data

    @staticmethod
    def _parse_json_payload(value, fallback_message):
        try:
            return json.loads(value)
        except json.JSONDecodeError as error:
            raise serializers.ValidationError(fallback_message) from error


class ImportacaoNotaFiscalSerializer(serializers.ModelSerializer):
    importado_por_username = serializers.ReadOnlyField(source="importado_por.username")

    class Meta:
        model = ImportacaoNotaFiscal
        fields = [
            "id",
            "chave_acesso",
            "numero",
            "serie",
            "fornecedor_nome",
            "fornecedor_documento",
            "data_emissao",
            "arquivo_nome",
            "importado_por",
            "importado_por_username",
            "criado_em",
        ]


class PedidoVendaItemSerializer(serializers.ModelSerializer):
    variacao = serializers.PrimaryKeyRelatedField(
        queryset=Variacao.objects.select_related("produto").all()
    )
    quantidade = serializers.IntegerField(min_value=1)
    preco_unitario = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=0,
    )
    produto_nome = serializers.ReadOnlyField(source="variacao.produto.nome")
    produto_sku = serializers.ReadOnlyField(source="variacao.produto.sku")
    marca = serializers.ReadOnlyField(source="variacao.produto.marca")
    cor = serializers.ReadOnlyField(source="variacao.cor")
    tamanho = serializers.ReadOnlyField(source="variacao.tamanho")
    numeracao = serializers.ReadOnlyField(source="variacao.numeracao")
    subtotal = serializers.SerializerMethodField()
    saldo_atual = serializers.ReadOnlyField(source="variacao.saldo_atual")

    class Meta:
        model = PedidoVendaItem
        fields = [
            "id",
            "variacao",
            "produto_nome",
            "produto_sku",
            "marca",
            "cor",
            "tamanho",
            "numeracao",
            "quantidade",
            "preco_unitario",
            "subtotal",
            "saldo_atual",
            "movimentacao_saida",
            "movimentacao_estorno",
        ]
        read_only_fields = [
            "id",
            "produto_nome",
            "produto_sku",
            "marca",
            "cor",
            "tamanho",
            "numeracao",
            "subtotal",
            "saldo_atual",
            "movimentacao_saida",
            "movimentacao_estorno",
        ]

    def get_subtotal(self, obj):
        return obj.subtotal


class PedidoVendaSerializer(serializers.ModelSerializer):
    itens = PedidoVendaItemSerializer(many=True)
    criado_por_username = serializers.ReadOnlyField(source="criado_por.username")
    codigo = serializers.ReadOnlyField()
    valor_total = serializers.SerializerMethodField()

    class Meta:
        model = PedidoVenda
        fields = [
            "id",
            "codigo",
            "cliente_nome",
            "cliente_documento",
            "status",
            "observacao",
            "itens",
            "valor_total",
            "criado_por",
            "criado_por_username",
            "criado_em",
            "atualizado_em",
        ]
        read_only_fields = [
            "id",
            "codigo",
            "valor_total",
            "criado_por",
            "criado_por_username",
            "criado_em",
            "atualizado_em",
        ]

    def get_valor_total(self, obj):
        return obj.valor_total

    def validate(self, attrs):
        itens = attrs.get("itens")
        if not itens:
            raise serializers.ValidationError(
                {"itens": "Adicione pelo menos um item ao pedido."}
            )

        instance = (
            PedidoVenda.objects.get(pk=self.instance.pk)
            if self.instance is not None
            else PedidoVenda()
        )
        for field, value in attrs.items():
            if field != "itens":
                setattr(instance, field, value)
        _validate_model_instance(instance)
        return attrs

    def create(self, validated_data):
        from .services import salvar_pedido_venda

        itens_data = validated_data.pop("itens")
        usuario = self.context.get("request").user if self.context.get("request") else None
        try:
            return salvar_pedido_venda(
                dados_pedido=validated_data,
                itens_data=itens_data,
                usuario=usuario,
            )
        except DjangoValidationError as error:
            _raise_drf_validation(error)

    def update(self, instance, validated_data):
        from .services import salvar_pedido_venda

        itens_data = validated_data.pop("itens")
        usuario = self.context.get("request").user if self.context.get("request") else None
        try:
            return salvar_pedido_venda(
                pedido=instance,
                dados_pedido=validated_data,
                itens_data=itens_data,
                usuario=usuario,
            )
        except DjangoValidationError as error:
            _raise_drf_validation(error)


class ConfiguracaoSistemaSerializer(serializers.ModelSerializer):
    logo_url = serializers.SerializerMethodField(read_only=True)
    remover_logo = serializers.BooleanField(write_only=True, required=False, default=False)
    atualizado_por_username = serializers.ReadOnlyField(source="atualizado_por.username")

    class Meta:
        model = ConfiguracaoSistema
        fields = [
            "id",
            "nome_empresa",
            "descricao_empresa",
            "logo",
            "logo_url",
            "remover_logo",
            "cor_primaria",
            "cor_secundaria",
            "cor_acento",
            "atualizado_por",
            "atualizado_por_username",
            "atualizado_em",
        ]
        read_only_fields = [
            "id",
            "logo_url",
            "atualizado_por",
            "atualizado_por_username",
            "atualizado_em",
        ]

    def get_logo_url(self, obj):
        if not obj.logo:
            return None

        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(obj.logo.url)
        return obj.logo.url

    def validate(self, attrs):
        instance = self.instance or ConfiguracaoSistema()
        remover_logo = attrs.pop("remover_logo", False)

        for field, value in attrs.items():
            setattr(instance, field, value)

        if remover_logo:
            instance.logo = None

        _validate_model_instance(instance)
        attrs["remover_logo"] = remover_logo
        return attrs

    def update(self, instance, validated_data):
        remover_logo = validated_data.pop("remover_logo", False)
        novo_logo = validated_data.get("logo")
        logo_storage = instance.logo.storage if instance.logo else None
        logo_anterior_nome = instance.logo.name if instance.logo else None

        for field, value in validated_data.items():
            setattr(instance, field, value)

        if remover_logo:
            instance.logo = None

        instance.save()

        if logo_storage and logo_anterior_nome:
            logo_atual_nome = instance.logo.name if instance.logo else None

            if remover_logo or (novo_logo and logo_atual_nome != logo_anterior_nome):
                logo_storage.delete(logo_anterior_nome)

        return instance
