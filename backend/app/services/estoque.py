from django.core.exceptions import ObjectDoesNotExist, ValidationError
from django.db import transaction

from ..models import Movimentacao, Variacao


OBSERVACOES_PADRAO = {
    Movimentacao.Tipo.ENTRADA: "Entrada registrada pelo sistema.",
    Movimentacao.Tipo.SAIDA: "Saida registrada pelo sistema.",
}


@transaction.atomic
def criar_variacao_com_estoque_inicial(
    *,
    produto,
    cor=None,
    tamanho=None,
    numeracao=None,
    estoque_inicial=0,
    observacao="",
    usuario=None,
):
    try:
        estoque_inicial = int(estoque_inicial or 0)
    except (TypeError, ValueError) as error:
        raise ValidationError(
            {"estoque_inicial": "Informe uma quantidade inicial valida."}
        ) from error

    if estoque_inicial < 0:
        raise ValidationError(
            {"estoque_inicial": "O estoque inicial nao pode ser negativo."}
        )

    variacao = Variacao(
        produto=produto,
        cor=cor,
        tamanho=tamanho,
        numeracao=numeracao,
        saldo_atual=0,
    )
    variacao.save()

    if estoque_inicial > 0:
        _, variacao = registrar_movimentacao(
            variacao=variacao,
            tipo=Movimentacao.Tipo.ENTRADA,
            quantidade=estoque_inicial,
            observacao=(
                observacao
                or f"Entrada inicial automatica do cadastro - {produto.nome}"
            ),
            usuario=usuario,
        )

    return variacao


@transaction.atomic
def registrar_movimentacao(*, variacao, tipo, quantidade, observacao="", usuario=None):
    variacao_id = variacao.pk if isinstance(variacao, Variacao) else variacao
    try:
        variacao_atual = (
            Variacao.objects.select_for_update()
            .select_related("produto")
            .get(pk=variacao_id)
        )
    except ObjectDoesNotExist as error:
        raise ValidationError({"variacao": "Variacao informada nao foi encontrada."}) from error

    try:
        quantidade = int(quantidade)
    except (TypeError, ValueError) as error:
        raise ValidationError({"quantidade": "Informe uma quantidade valida."}) from error

    if quantidade < 1:
        raise ValidationError({"quantidade": "A quantidade deve ser maior que zero."})

    if tipo not in {Movimentacao.Tipo.ENTRADA, Movimentacao.Tipo.SAIDA}:
        raise ValidationError({"tipo": "Tipo de movimentacao invalido."})

    if tipo == Movimentacao.Tipo.SAIDA and quantidade > variacao_atual.saldo_atual:
        raise ValidationError(
            {"quantidade": "Estoque insuficiente para realizar a saida."}
        )

    saldo_atualizado = variacao_atual.saldo_atual + (
        quantidade if tipo == Movimentacao.Tipo.ENTRADA else -quantidade
    )
    variacao_atual.saldo_atual = saldo_atualizado
    variacao_atual.save(update_fields=["saldo_atual"])

    movimentacao = Movimentacao.objects.create(
        variacao=variacao_atual,
        tipo=tipo,
        quantidade=quantidade,
        observacao=(observacao or "").strip() or OBSERVACOES_PADRAO[tipo],
        responsavel=usuario if getattr(usuario, "is_authenticated", False) else None,
    )

    return movimentacao, variacao_atual
