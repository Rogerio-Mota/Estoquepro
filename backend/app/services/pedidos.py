from django.core.exceptions import ValidationError
from django.db import transaction

from ..models import Movimentacao, PedidoVenda, PedidoVendaItem
from .estoque import registrar_movimentacao


def _validar_itens_pedido(itens_data):
    if not itens_data:
        raise ValidationError({"itens": "Adicione pelo menos um item a venda."})

    variacoes = set()
    for item in itens_data:
        variacao_id = item["variacao"].pk
        if variacao_id in variacoes:
            raise ValidationError(
                {"itens": "Nao repita a mesma variacao em mais de uma linha da venda."}
            )
        variacoes.add(variacao_id)


def _criar_itens_venda(pedido, itens_data):
    itens_criados = []
    for item in itens_data:
        itens_criados.append(
            PedidoVendaItem.objects.create(
                pedido=pedido,
                variacao=item["variacao"],
                quantidade=item["quantidade"],
                preco_unitario=item["preco_unitario"],
            )
        )
    return itens_criados


def _aplicar_estoque_venda(pedido, itens, usuario=None):
    for item in itens:
        try:
            movimentacao, _ = registrar_movimentacao(
                variacao=item.variacao,
                tipo=Movimentacao.Tipo.SAIDA,
                quantidade=item.quantidade,
                observacao=(
                    f"Saida automatica da venda {pedido.codigo} - "
                    f"{item.variacao.produto.nome}"
                ),
                usuario=usuario,
            )
        except ValidationError as error:
            if getattr(error, "message_dict", {}).get("quantidade"):
                raise ValidationError(
                    {
                        "itens": (
                            "Estoque insuficiente para concluir a venda. "
                            f"{item.variacao.produto.nome} possui "
                            f"{item.variacao.saldo_atual} unidade(s) disponivel(is) "
                            f"e a venda solicita {item.quantidade}."
                        )
                    }
                ) from error
            raise

        item.movimentacao_saida = movimentacao
        item.save(update_fields=["movimentacao_saida"])


@transaction.atomic
def salvar_pedido_venda(*, dados_pedido, itens_data, usuario=None, pedido=None):
    if pedido is not None:
        raise ValidationError(
            {"detail": "As vendas registradas nao podem ser editadas."}
        )

    _validar_itens_pedido(itens_data)

    pedido = PedidoVenda(
        criado_por=usuario,
        cliente_nome=dados_pedido.get("cliente_nome", ""),
        status=PedidoVenda.Status.FINALIZADO,
    )
    pedido.save()

    itens = _criar_itens_venda(pedido, itens_data)
    _aplicar_estoque_venda(pedido, itens, usuario=usuario)
    return pedido
