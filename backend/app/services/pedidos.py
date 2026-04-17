from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import transaction

from ..models import Movimentacao, PedidoVenda, PedidoVendaItem
from .estoque import registrar_movimentacao


def _validar_itens_pedido(itens_data):
    if not itens_data:
        raise ValidationError({"itens": "Adicione pelo menos um item ao pedido."})

    variacoes = set()
    for item in itens_data:
        variacao_id = item["variacao"].pk
        if variacao_id in variacoes:
            raise ValidationError(
                {"itens": "Nao repita a mesma variacao em mais de uma linha do pedido."}
            )
        variacoes.add(variacao_id)


def _itens_pedido_sao_iguais(pedido, itens_data):
    itens_atuais = sorted(
        (
            item.variacao_id,
            int(item.quantidade),
            Decimal(item.preco_unitario),
        )
        for item in pedido.itens.all()
    )
    itens_novos = sorted(
        (
            item["variacao"].pk,
            int(item["quantidade"]),
            Decimal(item["preco_unitario"]),
        )
        for item in itens_data
    )
    return itens_atuais == itens_novos


def _substituir_itens_pedido(pedido, itens_data):
    PedidoVendaItem.objects.filter(pedido=pedido).delete()

    for item in itens_data:
        PedidoVendaItem.objects.create(
            pedido=pedido,
            variacao=item["variacao"],
            quantidade=item["quantidade"],
            preco_unitario=item["preco_unitario"],
        )


def _aplicar_estoque_pedido(pedido, usuario=None):
    itens = list(pedido.itens.select_related("variacao", "variacao__produto"))
    if not itens:
        raise ValidationError({"itens": "O pedido precisa ter itens para ser finalizado."})

    for item in itens:
        if item.movimentacao_saida_id:
            continue

        try:
            movimentacao, _ = registrar_movimentacao(
                variacao=item.variacao,
                tipo=Movimentacao.Tipo.SAIDA,
                quantidade=item.quantidade,
                observacao=(
                    f"Saida automatica do pedido {pedido.codigo} - "
                    f"{item.variacao.produto.nome}"
                ),
                usuario=usuario,
            )
        except ValidationError as error:
            if getattr(error, "message_dict", {}).get("quantidade"):
                raise ValidationError(
                    {
                        "itens": (
                            "Estoque insuficiente para finalizar o pedido. "
                            f"{item.variacao.produto.nome} possui "
                            f"{item.variacao.saldo_atual} unidade(s) disponivel(is) "
                            f"e o pedido solicita {item.quantidade}."
                        )
                    }
                ) from error
            raise

        item.movimentacao_saida = movimentacao
        item.save(update_fields=["movimentacao_saida"])


def _estornar_estoque_pedido(pedido, usuario=None):
    itens = list(pedido.itens.select_related("variacao", "variacao__produto"))

    for item in itens:
        if not item.movimentacao_saida_id or item.movimentacao_estorno_id:
            continue

        movimentacao, _ = registrar_movimentacao(
            variacao=item.variacao,
            tipo=Movimentacao.Tipo.ENTRADA,
            quantidade=item.quantidade,
            observacao=(
                f"Estorno automatico do pedido {pedido.codigo} - "
                f"{item.variacao.produto.nome}"
            ),
            usuario=usuario,
        )
        item.movimentacao_estorno = movimentacao
        item.save(update_fields=["movimentacao_estorno"])


@transaction.atomic
def salvar_pedido_venda(*, dados_pedido, itens_data, usuario=None, pedido=None):
    _validar_itens_pedido(itens_data)

    status_novo = dados_pedido.get("status") or PedidoVenda.Status.RASCUNHO
    pedido_existente = pedido is not None
    status_atual = pedido.status if pedido_existente else PedidoVenda.Status.RASCUNHO

    if pedido_existente and pedido.status == PedidoVenda.Status.CANCELADO:
        raise ValidationError({"status": "Pedidos cancelados nao podem ser alterados."})

    if pedido_existente and pedido.status == PedidoVenda.Status.FINALIZADO:
        if status_novo == PedidoVenda.Status.RASCUNHO:
            raise ValidationError(
                {"status": "Pedidos finalizados nao podem voltar para rascunho."}
            )

        if not _itens_pedido_sao_iguais(pedido, itens_data):
            raise ValidationError(
                {"itens": "Pedidos finalizados nao podem ter seus itens alterados."}
            )

    if not pedido_existente:
        pedido = PedidoVenda(criado_por=usuario)

    for field, value in dados_pedido.items():
        setattr(pedido, field, value)

    pedido.save()

    if not pedido_existente or status_atual == PedidoVenda.Status.RASCUNHO:
        _substituir_itens_pedido(pedido, itens_data)

    if (
        status_novo == PedidoVenda.Status.FINALIZADO
        and status_atual != PedidoVenda.Status.FINALIZADO
    ):
        _aplicar_estoque_pedido(pedido, usuario=usuario)

    if (
        status_novo == PedidoVenda.Status.CANCELADO
        and status_atual == PedidoVenda.Status.FINALIZADO
    ):
        _estornar_estoque_pedido(pedido, usuario=usuario)

    return pedido
