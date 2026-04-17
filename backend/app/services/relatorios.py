import calendar
from collections import defaultdict
from datetime import datetime, timedelta
from decimal import Decimal

from django.core.exceptions import ValidationError
from django.utils import timezone

from ..models import Movimentacao, PedidoVenda, Produto
from .common import MESES_PT_BR


def _resolver_periodo_mensal(ano=None, mes=None):
    agora = timezone.localtime()
    ano = int(ano or agora.year)
    mes = int(mes or agora.month)

    if mes < 1 or mes > 12:
        raise ValidationError({"mes": "Informe um mes valido entre 1 e 12."})

    inicio = timezone.make_aware(datetime(ano, mes, 1, 0, 0, 0))
    ultimo_dia = calendar.monthrange(ano, mes)[1]
    fim = timezone.make_aware(datetime(ano, mes, ultimo_dia, 23, 59, 59))
    return ano, mes, inicio, fim


def _serializar_produto_reposicao(produto, saida_recente, sugestao_pedido):
    estoque_atual = produto.estoque_total
    status = "urgente" if estoque_atual < produto.estoque_minimo else "atencao"
    if estoque_atual == 0:
        status = "urgente"

    return {
        "produto_id": produto.id,
        "nome": produto.nome,
        "marca": produto.marca,
        "sku": produto.sku,
        "fornecedor_nome": produto.fornecedor.nome if produto.fornecedor else "",
        "estoque_atual": estoque_atual,
        "estoque_minimo": produto.estoque_minimo,
        "saida_recente": saida_recente,
        "sugestao_pedido": sugestao_pedido,
        "status": status,
        "preco_custo": f"{Decimal(produto.preco_custo or 0):.2f}",
        "valor_estimado_pedido": f"{Decimal(produto.preco_custo or 0) * Decimal(sugestao_pedido):.2f}",
    }


def gerar_relatorio_reposicao(*, dias_base=30):
    try:
        dias_base = int(dias_base or 30)
    except (TypeError, ValueError) as error:
        raise ValidationError({"dias_base": "Informe um numero valido de dias."}) from error

    if dias_base < 1 or dias_base > 365:
        raise ValidationError({"dias_base": "Use um periodo entre 1 e 365 dias."})

    data_corte = timezone.now() - timedelta(days=dias_base)
    produtos = list(
        Produto.objects.select_related("fornecedor")
        .prefetch_related("variacoes")
        .order_by("nome")
    )
    saidas_recentes = defaultdict(int)

    for movimentacao in (
        Movimentacao.objects.filter(
            tipo=Movimentacao.Tipo.SAIDA,
            data__gte=data_corte,
        )
        .select_related("variacao__produto")
        .order_by("-data")
    ):
        saidas_recentes[movimentacao.variacao.produto_id] += movimentacao.quantidade

    itens = []
    for produto in produtos:
        estoque_atual = produto.estoque_total
        saida_recente = saidas_recentes.get(produto.id, 0)
        estoque_referencia = max(produto.estoque_minimo, saida_recente)
        sugestao_pedido = max(estoque_referencia - estoque_atual, 0)

        if produto.estoque_baixo() and sugestao_pedido == 0:
            sugestao_pedido = 1 if produto.estoque_minimo == 0 else max(
                produto.estoque_minimo - estoque_atual,
                1,
            )

        if sugestao_pedido <= 0:
            continue

        itens.append(
            _serializar_produto_reposicao(
                produto,
                saida_recente,
                sugestao_pedido,
            )
        )

    itens.sort(
        key=lambda item: (
            0 if item["status"] == "urgente" else 1,
            -item["sugestao_pedido"],
            item["nome"],
        )
    )

    valor_total_estimado = sum(
        Decimal(item["valor_estimado_pedido"]) for item in itens
    )

    return {
        "gerado_em": timezone.now().isoformat(),
        "dias_base": dias_base,
        "itens": itens,
        "resumo": {
            "total_itens": len(itens),
            "itens_urgentes": sum(1 for item in itens if item["status"] == "urgente"),
            "quantidade_total_sugerida": sum(item["sugestao_pedido"] for item in itens),
            "valor_total_estimado": f"{valor_total_estimado:.2f}",
        },
    }


def gerar_relatorio_mensal(*, ano=None, mes=None):
    ano, mes, inicio, fim = _resolver_periodo_mensal(ano, mes)
    movimentacoes = list(
        Movimentacao.objects.filter(data__range=(inicio, fim))
        .select_related("variacao__produto")
        .order_by("data")
    )
    pedidos = list(
        PedidoVenda.objects.filter(
            status=PedidoVenda.Status.FINALIZADO,
            atualizado_em__range=(inicio, fim),
        )
        .prefetch_related("itens")
        .order_by("-atualizado_em")
    )
    saidas_por_produto = defaultdict(int)
    entradas_por_dia = defaultdict(int)
    saidas_por_dia = defaultdict(int)

    entradas_unidades = 0
    saidas_unidades = 0
    for movimentacao in movimentacoes:
        data_chave = timezone.localtime(movimentacao.data).date().isoformat()
        produto = movimentacao.variacao.produto

        if movimentacao.tipo == Movimentacao.Tipo.ENTRADA:
            entradas_unidades += movimentacao.quantidade
            entradas_por_dia[data_chave] += movimentacao.quantidade
        else:
            saidas_unidades += movimentacao.quantidade
            saidas_por_dia[data_chave] += movimentacao.quantidade
            saidas_por_produto[produto.id] += movimentacao.quantidade

    faturamento_estimado = sum(Decimal(pedido.valor_total) for pedido in pedidos)
    relatorio_reposicao = gerar_relatorio_reposicao(dias_base=30)
    produtos_por_id = {
        produto.id: produto
        for produto in Produto.objects.select_related("fornecedor").all()
    }
    top_saidas = []
    for produto_id, quantidade in sorted(
        saidas_por_produto.items(),
        key=lambda item: item[1],
        reverse=True,
    )[:5]:
        produto = produtos_por_id.get(produto_id)
        if produto is None:
            continue
        top_saidas.append(
            {
                "produto_id": produto.id,
                "nome": produto.nome,
                "marca": produto.marca,
                "sku": produto.sku,
                "quantidade": quantidade,
            }
        )

    total_dias = calendar.monthrange(ano, mes)[1]
    movimentacoes_por_dia = []
    for dia in range(1, total_dias + 1):
        data_corrente = datetime(ano, mes, dia).date()
        chave = data_corrente.isoformat()
        movimentacoes_por_dia.append(
            {
                "data": chave,
                "label": data_corrente.strftime("%d/%m"),
                "entradas": entradas_por_dia.get(chave, 0),
                "saidas": saidas_por_dia.get(chave, 0),
            }
        )

    return {
        "referencia": {
            "ano": ano,
            "mes": mes,
            "label": f"{MESES_PT_BR[mes]}/{ano}",
            "inicio": inicio.isoformat(),
            "fim": fim.isoformat(),
        },
        "resumo": {
            "entradas_unidades": entradas_unidades,
            "saidas_unidades": saidas_unidades,
            "movimentacoes": len(movimentacoes),
            "pedidos_finalizados": len(pedidos),
            "faturamento_estimado": f"{faturamento_estimado:.2f}",
        },
        "movimentacoes_por_dia": movimentacoes_por_dia,
        "top_saidas": top_saidas,
        "reposicao_sugerida": relatorio_reposicao["itens"][:10],
    }
