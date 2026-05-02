from django.contrib.auth.models import User
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import Q
from rest_framework import serializers

from .models import (
    Fornecedor,
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


def _admins_queryset():
    return User.objects.filter(
        Q(is_superuser=True) | Q(perfil__tipo=PerfilUsuario.Tipo.ADMIN)
    )


class UsuarioSerializer(serializers.ModelSerializer):
    tipo = serializers.ChoiceField(choices=PerfilUsuario.Tipo.choices, source="perfil.tipo")
    password = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = User
        fields = ["id", "username", "password", "tipo"]

    def validate(self, attrs):
        if self.instance is None and not attrs.get("password"):
            raise serializers.ValidationError(
                {"password": "A senha e obrigatoria para criar um usuario."}
            )

        perfil_data = attrs.get("perfil", {})
        tipo_desejado = perfil_data.get(
            "tipo",
            self.instance.perfil.tipo
            if self.instance is not None and hasattr(self.instance, "perfil")
            else PerfilUsuario.Tipo.FUNCIONARIO,
        )
        instancia_eh_admin = bool(
            self.instance
            and (
                self.instance.is_superuser
                or (
                    hasattr(self.instance, "perfil")
                    and self.instance.perfil.tipo == PerfilUsuario.Tipo.ADMIN
                )
            )
        )

        if tipo_desejado == PerfilUsuario.Tipo.ADMIN:
            admins_existentes = _admins_queryset()
            if instancia_eh_admin:
                admins_existentes = admins_existentes.exclude(pk=self.instance.pk)

            if admins_existentes.exists():
                raise serializers.ValidationError(
                    {"tipo": "O sistema permite apenas um administrador principal."}
                )

        if (
            self.instance is not None
            and instancia_eh_admin
            and tipo_desejado != PerfilUsuario.Tipo.ADMIN
            and not _admins_queryset().exclude(pk=self.instance.pk).exists()
        ):
            raise serializers.ValidationError(
                {"tipo": "O sistema precisa manter um administrador principal."}
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
    produtos_fornecidos = serializers.SerializerMethodField()

    class Meta:
        model = Fornecedor
        fields = [
            "id",
            "nome",
            "contato",
            "cidade",
            "produtos_fornecidos",
            "criado_em",
        ]

    def get_produtos_fornecidos(self, obj):
        return [produto.nome for produto in obj.produtos.order_by("nome")]


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
    fornecedor_nome = serializers.ReadOnlyField(source="fornecedor.nome")
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
            "fornecedor",
            "fornecedor_nome",
            "responsavel",
            "responsavel_username",
            "responsavel_tipo",
            "data_referencia",
            "data",
        ]


class MovimentacaoEstoqueSerializer(serializers.Serializer):
    variacao = serializers.PrimaryKeyRelatedField(
        queryset=Variacao.objects.select_related("produto").all()
    )
    quantidade = serializers.IntegerField(min_value=1)
    observacao = serializers.CharField(required=False, allow_blank=True, allow_null=True)


class EntradaEstoqueSerializer(MovimentacaoEstoqueSerializer):
    fornecedor = serializers.PrimaryKeyRelatedField(queryset=Fornecedor.objects.all())
    data_referencia = serializers.DateField()


class SaidaEstoqueSerializer(MovimentacaoEstoqueSerializer):
    pass


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
                {"itens": "Adicione pelo menos um item a venda."}
            )

        instance = PedidoVenda()
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
