import re
import unicodedata
from datetime import datetime, time
from decimal import Decimal, InvalidOperation
from difflib import SequenceMatcher

from django.core.exceptions import ValidationError
from django.db.models import Q
from django.utils import timezone
from django.utils.dateparse import parse_date, parse_datetime

from ..models import Fornecedor, Produto, Variacao


SUBCATEGORIA_POR_TERMO = (
    (("tenis", "sneaker"), (Produto.Categoria.CALCADO, Produto.Subcategoria.TENIS)),
    (
        ("camiseta", "camisa", "polo", "blusa"),
        (Produto.Categoria.ROUPA, Produto.Subcategoria.CAMISA),
    ),
    (
        ("calca", "jeans"),
        (Produto.Categoria.ROUPA, Produto.Subcategoria.CALCA),
    ),
    (
        ("bermuda", "short"),
        (Produto.Categoria.ROUPA, Produto.Subcategoria.BERMUDA),
    ),
    (("cinto",), (Produto.Categoria.ACESSORIO, Produto.Subcategoria.CINTO)),
    (
        ("perfume", "colonia", "fragrancia", "parfum"),
        (Produto.Categoria.PERFUMARIA, Produto.Subcategoria.PERFUME),
    ),
    (
        ("pulseira", "colar", "corrente", "anel", "bracelete", "brinco", "pingente"),
        (Produto.Categoria.ACESSORIO, Produto.Subcategoria.BIJUTERIA),
    ),
    (
        ("argamassa", "cimento", "rejunte", "porcelanato", "tinta", "massa acrilica"),
        (Produto.Categoria.GERAL, Produto.Subcategoria.GERAL),
    ),
    (
        ("parafuso", "porca", "arruela", "ferragem", "fita", "cabide", "suporte"),
        (Produto.Categoria.GERAL, Produto.Subcategoria.GERAL),
    ),
)

COR_POR_TERMO = (
    ("preto", "Preto"),
    ("branco", "Branco"),
    ("azul", "Azul"),
    ("marinho", "Marinho"),
    ("verde", "Verde"),
    ("vermelho", "Vermelho"),
    ("vinho", "Vinho"),
    ("rosa", "Rosa"),
    ("bege", "Bege"),
    ("caqui", "Caqui"),
    ("cinza", "Cinza"),
    ("grafite", "Grafite"),
    ("amarelo", "Amarelo"),
    ("laranja", "Laranja"),
    ("marrom", "Marrom"),
    ("dourado", "Dourado"),
    ("prata", "Prata"),
)

TAMANHO_POR_TERMO = (
    ("PP", Variacao.Tamanho.PP),
    ("GG", Variacao.Tamanho.GG),
    ("UNICO", Variacao.Tamanho.U),
    ("UN", Variacao.Tamanho.U),
    ("P", Variacao.Tamanho.P),
    ("M", Variacao.Tamanho.M),
    ("G", Variacao.Tamanho.G),
)

NUMERACAO_PATTERN = re.compile(r"\b(3[6-9]|4[0-6])\b")

MESES_PT_BR = (
    "",
    "Janeiro",
    "Fevereiro",
    "Marco",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
)


def _get_text(node, path, default=""):
    if node is None:
        return default
    child = node.find(path)
    if child is None or child.text is None:
        return default
    return child.text.strip()


def _parse_decimal(value, default="0"):
    raw_value = (value or default or "0").strip()
    try:
        return Decimal(raw_value)
    except (InvalidOperation, AttributeError) as error:
        raise ValidationError(
            {"arquivo": f"Valor decimal invalido encontrado: {raw_value}"}
        ) from error


def _parse_data_emissao(raw_value):
    if not raw_value:
        return None

    parsed_datetime = parse_datetime(raw_value)
    if parsed_datetime is not None:
        if timezone.is_naive(parsed_datetime):
            return timezone.make_aware(parsed_datetime)
        return parsed_datetime

    parsed_date = parse_date(raw_value)
    if parsed_date is not None:
        return timezone.make_aware(datetime.combine(parsed_date, time.min))

    return None


def _normalizar_codigo_produto(codigo):
    return (codigo or "").strip().upper()


def _normalizar_codigo_comparavel(codigo):
    return re.sub(r"[^A-Z0-9]", "", _normalizar_codigo_produto(codigo))


def _normalizar_codigo_xml(codigo):
    codigo_normalizado = str(codigo or "").strip()
    if _normalizar_texto_livre(codigo_normalizado) in {"", "sem gtin", "no gtin"}:
        return ""
    return codigo_normalizado


def _normalizar_documento(documento):
    return "".join(char for char in str(documento or "") if char.isdigit())


def _normalizar_texto_livre(valor):
    base = unicodedata.normalize("NFKD", str(valor or ""))
    ascii_value = base.encode("ascii", "ignore").decode("ascii")
    return re.sub(r"\s+", " ", ascii_value).strip().lower()


def _to_optional_text(value):
    normalized = str(value or "").strip()
    return normalized or None


def _to_money(value):
    return Decimal(value or 0).quantize(Decimal("0.01"))


def _buscar_fornecedor_existente(nome, documento):
    documento_normalizado = _normalizar_documento(documento)
    if documento_normalizado:
        for fornecedor in Fornecedor.objects.all().order_by("nome"):
            if _normalizar_documento(fornecedor.documento) == documento_normalizado:
                return fornecedor

    nome_limpo = (nome or "").strip()
    if nome_limpo:
        fornecedor = Fornecedor.objects.filter(nome__iexact=nome_limpo).first()
        if fornecedor:
            return fornecedor

    nome_normalizado = _normalizar_texto_livre(nome_limpo)
    if nome_normalizado:
        for fornecedor in Fornecedor.objects.all().order_by("nome"):
            if _normalizar_texto_livre(fornecedor.nome) == nome_normalizado:
                return fornecedor

    return None


def _buscar_produto_por_codigo_produto(codigo_produto):
    codigo_normalizado = _normalizar_codigo_produto(codigo_produto)
    if not codigo_normalizado:
        return None

    codigos_candidatos = {codigo_normalizado}
    codigo_sem_zeros = codigo_normalizado.lstrip("0")
    if codigo_sem_zeros:
        codigos_candidatos.add(codigo_sem_zeros)

    filtro_sku = Q()
    for codigo in codigos_candidatos:
        filtro_sku |= Q(sku__iexact=codigo)

    produto = (
        Produto.objects.select_related("fornecedor")
        .prefetch_related("variacoes")
        .filter(filtro_sku | Q(codigo_barras__iexact=codigo_normalizado))
        .order_by("nome")
        .first()
    )
    if produto is not None:
        return produto

    codigo_comparavel = _normalizar_codigo_comparavel(codigo_normalizado)
    if not codigo_comparavel:
        return None

    for produto in (
        Produto.objects.select_related("fornecedor")
        .prefetch_related("variacoes")
        .order_by("nome")
    ):
        sku_comparavel = _normalizar_codigo_comparavel(produto.sku)
        if sku_comparavel == codigo_comparavel:
            return produto

    return None


def _buscar_produto_por_descricao_produto(descricao_produto, fornecedor_existente=None):
    descricao_normalizada = _normalizar_texto_livre(descricao_produto)
    if not descricao_normalizada:
        return None, 0

    categoria_inferida, subcategoria_inferida = _inferir_categoria_subcategoria(
        descricao_produto
    )
    candidatos = []

    for produto in (
        Produto.objects.select_related("fornecedor")
        .prefetch_related("variacoes")
        .order_by("nome")
    ):
        nome_normalizado = _normalizar_texto_livre(produto.nome)
        if not nome_normalizado:
            continue

        score = SequenceMatcher(None, descricao_normalizada, nome_normalizado).ratio()

        if nome_normalizado in descricao_normalizada:
            score += 0.12
        if produto.marca and _normalizar_texto_livre(produto.marca) in descricao_normalizada:
            score += 0.08
        if (
            fornecedor_existente
            and produto.fornecedor_id
            and produto.fornecedor_id == fornecedor_existente.id
        ):
            score += 0.06
        if categoria_inferida and produto.categoria == categoria_inferida:
            score += 0.04
        if subcategoria_inferida and produto.subcategoria == subcategoria_inferida:
            score += 0.05

        candidatos.append((min(score, 0.99), produto))

    if not candidatos:
        return None, 0

    candidatos.sort(key=lambda item: item[0], reverse=True)
    melhor_score, melhor_produto = candidatos[0]
    segundo_score = candidatos[1][0] if len(candidatos) > 1 else 0

    if melhor_score < 0.78:
        return None, melhor_score

    if segundo_score and melhor_score - segundo_score < 0.05:
        return None, melhor_score

    return melhor_produto, melhor_score


def _buscar_variacao_por_atributos(produto, cor, tamanho, numeracao):
    if produto is None:
        return None

    variacoes = produto.variacoes.all()

    if cor:
        variacoes = variacoes.filter(cor__iexact=cor)
    if tamanho:
        variacoes = variacoes.filter(tamanho=tamanho)
    if numeracao:
        variacoes = variacoes.filter(numeracao=numeracao)

    if cor or tamanho or numeracao:
        return variacoes.order_by("id").first()

    if produto.variacoes.count() == 1:
        return produto.variacoes.first()

    return None


def _buscar_variacoes_compativeis(codigo_produto=None, produto=None):
    produto = produto or _buscar_produto_por_codigo_produto(codigo_produto)
    if produto is None:
        return []

    variacoes = produto.variacoes.all().order_by("cor", "tamanho", "numeracao", "id")
    return [
        {
            "id": variacao.id,
            "label": formatar_variacao_para_opcao(variacao),
        }
        for variacao in variacoes
    ]


def _inferir_categoria_subcategoria(descricao_produto):
    descricao_normalizada = _normalizar_texto_livre(descricao_produto)

    for termos, resultado in SUBCATEGORIA_POR_TERMO:
        if any(re.search(rf"\b{re.escape(termo)}\b", descricao_normalizada) for termo in termos):
            return resultado

    return Produto.Categoria.GERAL, Produto.Subcategoria.GERAL


def _limpar_nome_produto_para_cadastro(descricao_produto, *, cor="", tamanho="", numeracao=""):
    nome_base = " ".join(str(descricao_produto or "").split())
    if not nome_base:
        return ""

    tokens_para_remover = [cor, tamanho, numeracao]
    for token in tokens_para_remover:
        token_limpo = str(token or "").strip()
        if not token_limpo:
            continue
        nome_base = re.sub(
            rf"(?<![A-Z0-9]){re.escape(token_limpo)}(?![A-Z0-9])",
            " ",
            nome_base,
            flags=re.IGNORECASE,
        )

    nome_base = re.sub(r"\s+", " ", nome_base).strip(" -/")
    return nome_base or "Produto sem descricao"


def _inferir_marca_sugerida(*, produto_existente=None, fornecedor_existente=None, fornecedor_nome=""):
    if produto_existente and produto_existente.marca:
        return produto_existente.marca
    if fornecedor_existente and fornecedor_existente.nome:
        return fornecedor_existente.nome
    fornecedor_nome = str(fornecedor_nome or "").strip()
    return fornecedor_nome or "Sem marca"


def _inferir_estoque_minimo_sugerido(quantidade):
    try:
        quantidade_decimal = Decimal(quantidade or 0)
    except (InvalidOperation, TypeError):
        return 0

    if quantidade_decimal <= 0:
        return 0

    if quantidade_decimal < 2:
        return 1

    return min(int(quantidade_decimal), 5)


def _inferir_cor(descricao_produto):
    descricao_normalizada = _normalizar_texto_livre(descricao_produto)

    for termo, cor in COR_POR_TERMO:
        if re.search(rf"\b{re.escape(termo)}\b", descricao_normalizada):
            return cor

    return ""


def _inferir_tamanho(subcategoria, descricao_produto):
    descricao_normalizada = _normalizar_texto_livre(descricao_produto).upper()

    if subcategoria in {Produto.Subcategoria.BIJUTERIA, Produto.Subcategoria.PERFUME}:
        return Variacao.Tamanho.U

    for termo, tamanho in TAMANHO_POR_TERMO:
        if re.search(rf"(?<![A-Z0-9]){re.escape(termo)}(?![A-Z0-9])", descricao_normalizada):
            return tamanho

    return ""


def _inferir_numeracao(subcategoria, descricao_produto):
    if subcategoria != Produto.Subcategoria.TENIS:
        return ""

    descricao_normalizada = _normalizar_texto_livre(descricao_produto).upper()
    match = NUMERACAO_PATTERN.search(descricao_normalizada)
    if match:
        return match.group(1)

    return ""


def _montar_sugestao_item_nota(
    *,
    codigo_produto,
    descricao_produto,
    codigo_barras="",
    ncm="",
    cest="",
    cfop="",
    unidade_comercial="",
    quantidade="0",
    valor_unitario,
    fornecedor_existente,
    fornecedor_nome="",
):
    categoria, subcategoria = _inferir_categoria_subcategoria(descricao_produto)
    cor = _inferir_cor(descricao_produto)
    tamanho = _inferir_tamanho(subcategoria, descricao_produto)
    numeracao = _inferir_numeracao(subcategoria, descricao_produto)
    codigo_referencia = codigo_produto or codigo_barras
    produto_existente = _buscar_produto_por_codigo_produto(codigo_referencia)
    criterio_sugestao = "codigo" if produto_existente else ""
    score_sugestao = 0.99 if produto_existente else 0

    if produto_existente is None:
        produto_existente, score_sugestao = _buscar_produto_por_descricao_produto(
            descricao_produto,
            fornecedor_existente=fornecedor_existente,
        )
        if produto_existente is not None:
            criterio_sugestao = "descricao"

    variacao_exata = _buscar_variacao_por_atributos(
        produto_existente,
        cor or None,
        tamanho or None,
        numeracao or None,
    )
    variacoes_compativeis = _buscar_variacoes_compativeis(
        codigo_produto=codigo_referencia,
        produto=produto_existente,
    )

    if variacao_exata is None and len(variacoes_compativeis) == 1:
        variacao_sugerida_id = variacoes_compativeis[0]["id"]
    else:
        variacao_sugerida_id = variacao_exata.id if variacao_exata else None

    if variacao_sugerida_id:
        acao_sugerida = "variacao_existente"
    elif produto_existente:
        acao_sugerida = "nova_variacao"
    else:
        acao_sugerida = "novo_produto"

    avisos = []
    if not codigo_referencia:
        avisos.append("Item sem codigo ou codigo de barras na nota.")
    if criterio_sugestao == "descricao":
        avisos.append("Sugestao encontrada por descricao. Revise antes de confirmar.")
    if produto_existente and not variacao_sugerida_id:
        avisos.append("Produto localizado, mas a variacao exata ainda precisa ser confirmada.")

    if variacao_sugerida_id and criterio_sugestao == "codigo":
        grau_confianca = "alta"
    elif produto_existente:
        grau_confianca = "media"
    else:
        grau_confianca = "baixa"

    return {
        "produto_existente": (
            {
                "id": produto_existente.id,
                "nome": produto_existente.nome,
                "sku": produto_existente.sku,
                "marca": produto_existente.marca,
                "categoria": produto_existente.categoria,
                "subcategoria": produto_existente.subcategoria,
                "fornecedor_id": produto_existente.fornecedor_id,
            }
            if produto_existente
            else None
        ),
        "acao_sugerida": acao_sugerida,
        "variacao_sugerida_id": variacao_sugerida_id,
        "variacoes_compativeis": variacoes_compativeis,
        "criterio_sugestao": criterio_sugestao or "sem_vinculo",
        "grau_confianca": grau_confianca,
        "score_sugestao": round(score_sugestao, 2) if score_sugestao else 0,
        "avisos": avisos,
        "nova_variacao_sugerida": (
            {
                "produto": produto_existente.id,
                "cor": cor,
                "tamanho": tamanho,
                "numeracao": numeracao,
            }
            if produto_existente and not variacao_sugerida_id
            else None
        ),
        "novo_produto_sugerido": (
            {
                "nome": _limpar_nome_produto_para_cadastro(
                    descricao_produto,
                    cor=cor,
                    tamanho=tamanho,
                    numeracao=numeracao,
                ),
                "marca": _inferir_marca_sugerida(
                    produto_existente=produto_existente,
                    fornecedor_existente=fornecedor_existente,
                    fornecedor_nome=fornecedor_nome,
                ),
                "categoria": categoria or Produto.Categoria.GERAL,
                "subcategoria": subcategoria or Produto.Subcategoria.GERAL,
                "sku": codigo_produto or codigo_barras or descricao_produto.strip()[:50],
                "codigo_barras": codigo_barras or "",
                "ncm": ncm or "",
                "cest": cest or "",
                "cfop": cfop or "",
                "unidade_comercial": unidade_comercial or "",
                "preco_custo": f"{_to_money(valor_unitario):.2f}",
                "preco_venda": f"{_to_money(valor_unitario):.2f}",
                "estoque_minimo": _inferir_estoque_minimo_sugerido(quantidade),
                "fornecedor": fornecedor_existente.id if fornecedor_existente else None,
                "cor": cor,
                "tamanho": tamanho,
                "numeracao": numeracao,
            }
            if produto_existente is None
            else None
        ),
    }


def formatar_variacao_para_opcao(variacao):
    partes = [variacao.produto.nome, f"SKU {variacao.produto.sku}"]

    if variacao.cor:
        partes.append(f"Cor {variacao.cor}")
    if variacao.tamanho:
        partes.append(f"Tam {variacao.tamanho}")
    if variacao.numeracao:
        partes.append(f"Num {variacao.numeracao}")

    partes.append(f"Saldo {variacao.saldo_atual}")
    return " | ".join(partes)
