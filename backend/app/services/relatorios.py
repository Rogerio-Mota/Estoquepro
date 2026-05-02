from datetime import datetime, timedelta

from django.core.exceptions import ValidationError
from django.db.models import Sum
from django.utils import timezone

from ..models import Movimentacao, PedidoVenda, PedidoVendaItem


def resolver_periodo_relatorio(periodo="mes"):
    periodo_normalizado = str(periodo or "mes").strip().lower()
    hoje = timezone.localdate()

    if periodo_normalizado == "dia":
        inicio_data = hoje
        fim_data = hoje
        label = hoje.strftime("%d/%m/%Y")
    elif periodo_normalizado == "semana":
        inicio_data = hoje - timedelta(days=hoje.weekday())
        fim_data = inicio_data + timedelta(days=6)
        label = f"Semana de {inicio_data.strftime('%d/%m')} a {fim_data.strftime('%d/%m')}"
    elif periodo_normalizado == "mes":
        inicio_data = hoje.replace(day=1)
        if inicio_data.month == 12:
            proximo_mes = inicio_data.replace(year=inicio_data.year + 1, month=1, day=1)
        else:
            proximo_mes = inicio_data.replace(month=inicio_data.month + 1, day=1)
        fim_data = proximo_mes - timedelta(days=1)
        label = inicio_data.strftime("%m/%Y")
    else:
        raise ValidationError({"periodo": "Use dia, semana ou mes."})

    inicio = timezone.make_aware(datetime.combine(inicio_data, datetime.min.time()))
    fim = timezone.make_aware(datetime.combine(fim_data, datetime.max.time()))

    return {
        "tipo": periodo_normalizado,
        "label": label,
        "inicio": inicio,
        "fim": fim,
    }


def gerar_relatorio_vendas(*, periodo="mes"):
    recorte = resolver_periodo_relatorio(periodo)
    inicio = recorte["inicio"]
    fim = recorte["fim"]

    vendas = PedidoVenda.objects.filter(
        status=PedidoVenda.Status.FINALIZADO,
        atualizado_em__range=(inicio, fim),
    )
    itens_agregados = (
        PedidoVendaItem.objects.filter(
            pedido__status=PedidoVenda.Status.FINALIZADO,
            pedido__atualizado_em__range=(inicio, fim),
        )
        .values("variacao__produto_id", "variacao__produto__nome", "variacao__produto__sku")
        .annotate(quantidade_total=Sum("quantidade"))
        .order_by("-quantidade_total", "variacao__produto__nome")
    )

    itens = [
        {
            "produto_id": item["variacao__produto_id"],
            "nome": item["variacao__produto__nome"],
            "sku": item["variacao__produto__sku"],
            "quantidade": item["quantidade_total"] or 0,
        }
        for item in itens_agregados
    ]

    total_itens_vendidos = sum(item["quantidade"] for item in itens)
    total_saidas = Movimentacao.objects.filter(
        tipo=Movimentacao.Tipo.SAIDA,
        data__range=(inicio, fim),
    ).count()

    return {
        "periodo": {
            "tipo": recorte["tipo"],
            "label": recorte["label"],
            "inicio": inicio.isoformat(),
            "fim": fim.isoformat(),
        },
        "resumo": {
            "vendas_registradas": vendas.count(),
            "itens_vendidos": total_itens_vendidos,
            "produtos_vendidos": len(itens),
            "movimentacoes_saida": total_saidas,
        },
        "itens": itens,
    }
