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


def _usuario_tipo(instance):
    if instance.is_superuser:
        return PerfilUsuario.Tipo.ADMIN

    if hasattr(instance, "perfil") and instance.perfil.tipo == PerfilUsuario.Tipo.ADMIN:
        return PerfilUsuario.Tipo.ADMIN

    return PerfilUsuario.Tipo.FUNCIONARIO


class UsuarioSerializer(serializers.ModelSerializer):
    tipo = serializers.ChoiceField(choices=PerfilUsuario.Tipo.choices, source="perfil.tipo")
    password = serializers.CharField(write_only=True, required=False)
    administrador_principal = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "password", "tipo", "administrador_principal"]

    def get_administrador_principal(self, obj):
        return bool(obj.is_superuser)

    def validate(self, attrs):
        if self.instance is None and not attrs.get("password"):
            raise serializers.ValidationError(
                {"password": "A senha é obrigatória para criar um usuário."}
            )

        perfil_data = attrs.get("perfil", {})
        tipo_desejado = perfil_data.get(
            "tipo",
            _usuario_tipo(self.instance)
            if self.instance is not None
            else PerfilUsuario.Tipo.FUNCIONARIO,
        )
        instancia_eh_admin = bool(self.instance and _usuario_tipo(self.instance) == PerfilUsuario.Tipo.ADMIN)

        if (
            self.instance is not None
            and self.instance.is_superuser
            and tipo_desejado != PerfilUsuario.Tipo.ADMIN
        ):
            raise serializers.ValidationError(
                {
                    "tipo": (
                        "Use o comando de manutenção para transferir o administrador principal."
                    )
                }
            )

        if (
            self.instance is not None
            and instancia_eh_admin
            and tipo_desejado != PerfilUsuario.Tipo.ADMIN
            and not _admins_queryset().exclude(pk=self.instance.pk).exists()
        ):
            raise serializers.ValidationError(
                {"tipo": "O sistema precisa manter pelo menos um administrador ativo."}
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
                defaults={
                    "tipo": (
                        PerfilUsuario.Tipo.ADMIN
                        if instance.is_superuser
                        else perfil_data.get("tipo", _usuario_tipo(instance))
                    )
                },
            )

        return instance

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["tipo"] = _usuario_tipo(instance)
        return data


class UsuarioLogadoSerializer(serializers.ModelSerializer):
    tipo = serializers.SerializerMethodField()
    administrador_principal = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "tipo", "administrador_principal"]

    def get_tipo(self, obj):
        return _usuario_tipo(obj)

    def get_administrador_principal(self, obj):
        return bool(obj.is_superuser)


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
    produto_preco_venda = serializers.ReadOnlyField(source="produto.preco_venda")
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
            "produto_preco_venda",
            "cor",
            "tamanho",
            "numeracao",
            "saldo_atual",
            "estoque_inicial",
            "criado_em",
        ]
        read_only_fields = [
            "id",
            "produto_nome",
            "produto_sku",
            "produto_preco_venda",
            "saldo_atual",
            "criado_em",
        ]

    def validate(self, attrs):
        if self.instance is not None and "estoque_inicial" in attrs:
            raise serializers.ValidationError(
                {
                    "estoque_inicial": (
                        "Use uma movimentação para ajustar o estoque de uma variação existente."
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
            observacao=f"Entrada inicial automática do cadastro - {produto.nome}",
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
                {"itens": "Adicione pelo menos um item à venda."}
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
