import re
import zlib
from collections import Counter
from datetime import datetime, time
from decimal import Decimal
from xml.etree import ElementTree

from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone

from ..models import (
    Fornecedor,
    ImportacaoNotaFiscal,
    ImportacaoNotaFiscalItem,
    Movimentacao,
    Produto,
    Variacao,
)
from .common import (
    _buscar_fornecedor_existente,
    _get_text,
    _montar_sugestao_item_nota,
    _normalizar_codigo_xml,
    _normalizar_documento,
    _normalizar_texto_livre,
    _parse_data_emissao,
    _parse_decimal,
    _to_optional_text,
)
from .estoque import registrar_movimentacao


PDF_STREAM_PATTERN = re.compile(
    rb"<<(?P<header>.*?)>>\s*stream\r?\n(?P<stream>.*?)\r?\nendstream",
    re.DOTALL,
)
CHAVE_ACESSO_PATTERN = re.compile(r"\b\d{44}\b")
CNPJ_PATTERN = re.compile(r"\b\d{2}\.?\d{3}\.?\d{3}/?\d{4}-?\d{2}\b|\b\d{11}\b")
ITEM_PDF_PATTERNS = (
    re.compile(
        r"^ITEM\s*(?P<indice>\d{1,3})\s+COD(?:IGO)?\s*(?P<codigo>[A-Z0-9._/-]{2,})\s+"
        r"DESCRICAO\s*(?P<descricao>.+?)\s+QTD\s*(?P<quantidade>\d+(?:[.,]\d{1,4})?)\s+"
        r"VUN\s*(?P<valor_unitario>\d+(?:[.,]\d{2,4})?)$",
        re.IGNORECASE,
    ),
    re.compile(
        r"^(?P<indice>\d{1,3})\s+(?P<codigo>[A-Z0-9._/-]{2,})\s+(?P<descricao>.+?)\s+"
        r"(?P<quantidade>\d+(?:[.,]\d{1,4})?)\s+(?P<valor_unitario>\d+(?:[.,]\d{2,4})?)\s+"
        r"\d+(?:[.,]\d{2,4})?$",
        re.IGNORECASE,
    ),
    re.compile(
        r"^(?P<codigo>[A-Z0-9._/-]{2,})\s*-\s*(?P<descricao>.+?)\s+QTD[: ]"
        r"(?P<quantidade>\d+(?:[.,]\d{1,4})?)\s+V(?:UN|LR)[: ]"
        r"(?P<valor_unitario>\d+(?:[.,]\d{2,4})?)$",
        re.IGNORECASE,
    ),
)


def _parse_decimal_flex(value, default="0"):
    raw_value = str(value or default or "0").strip()
    if not raw_value:
        raw_value = default

    if "," in raw_value and "." in raw_value:
        if raw_value.rfind(",") > raw_value.rfind("."):
            raw_value = raw_value.replace(".", "").replace(",", ".")
        else:
            raw_value = raw_value.replace(",", "")
    elif "," in raw_value:
        raw_value = raw_value.replace(".", "").replace(",", ".")

    return _parse_decimal(raw_value, default=default)


def _parse_data_emissao_flex(raw_value):
    parsed = _parse_data_emissao(raw_value)
    if parsed is not None:
        return parsed

    normalized = str(raw_value or "").strip()
    if not normalized:
        return None

    for pattern in ("%d/%m/%Y %H:%M:%S", "%d/%m/%Y %H:%M", "%d/%m/%Y"):
        try:
            parsed_date = datetime.strptime(normalized, pattern)
        except ValueError:
            continue

        if pattern == "%d/%m/%Y":
            parsed_date = datetime.combine(parsed_date.date(), time.min)

        return timezone.make_aware(parsed_date)

    return None


def _arquivo_eh_pdf(arquivo):
    nome = getattr(arquivo, "name", "").lower()
    if nome.endswith(".pdf"):
        return True

    content_type = getattr(arquivo, "content_type", "")
    if "pdf" in str(content_type).lower():
        return True

    posicao_inicial = arquivo.tell()
    try:
        return arquivo.read(4) == b"%PDF"
    finally:
        arquivo.seek(posicao_inicial)


def _buscar_importacao_existente_por_nota(
    *,
    chave_acesso,
    numero,
    serie,
    fornecedor_nome,
    fornecedor_documento,
    data_emissao,
):
    if chave_acesso:
        return ImportacaoNotaFiscal.objects.filter(chave_acesso=chave_acesso).first()

    numero_normalizado = str(numero or "").strip()
    serie_normalizada = str(serie or "").strip()
    documento_normalizado = _normalizar_documento(fornecedor_documento)
    fornecedor_normalizado = _normalizar_texto_livre(fornecedor_nome)
    data_referencia = (
        timezone.localtime(data_emissao).date() if data_emissao is not None else None
    )

    if not numero_normalizado and not serie_normalizada:
        return None

    candidatos = ImportacaoNotaFiscal.objects.all().order_by("-criado_em", "-id")
    for importacao in candidatos:
        if numero_normalizado and str(importacao.numero or "").strip() != numero_normalizado:
            continue
        if serie_normalizada and str(importacao.serie or "").strip() != serie_normalizada:
            continue
        if data_referencia is not None:
            if importacao.data_emissao is None:
                continue
            if timezone.localtime(importacao.data_emissao).date() != data_referencia:
                continue
        if documento_normalizado:
            if _normalizar_documento(importacao.fornecedor_documento) != documento_normalizado:
                continue
        elif fornecedor_normalizado:
            if _normalizar_texto_livre(importacao.fornecedor_nome) != fornecedor_normalizado:
                continue
        else:
            continue
        return importacao

    return None


def _montar_resumo_preview(itens):
    contagem_acoes = Counter(item["acao_sugerida"] for item in itens)
    contagem_confianca = Counter(item["grau_confianca"] for item in itens)
    itens_com_aviso = sum(1 for item in itens if item.get("avisos"))
    itens_fracionados = sum(1 for item in itens if item["possui_quantidade_fracionada"])

    return {
        "total_itens": len(itens),
        "variacoes_existentes": contagem_acoes.get("variacao_existente", 0),
        "novas_variacoes": contagem_acoes.get("nova_variacao", 0),
        "novos_produtos": contagem_acoes.get("novo_produto", 0),
        "confianca_alta": contagem_confianca.get("alta", 0),
        "confianca_media": contagem_confianca.get("media", 0),
        "confianca_baixa": contagem_confianca.get("baixa", 0),
        "itens_com_aviso": itens_com_aviso,
        "itens_fracionados": itens_fracionados,
    }


def _construir_preview_nota(
    *,
    chave_acesso,
    numero,
    serie,
    fornecedor_nome,
    fornecedor_documento,
    data_emissao,
    arquivo_nome,
    itens_brutos,
    tipo_arquivo,
    modo_leitura,
    requer_conferencia_manual=False,
):
    fornecedor_existente = _buscar_fornecedor_existente(
        fornecedor_nome,
        fornecedor_documento,
    )

    itens = []
    for item in itens_brutos:
        codigo_produto = _normalizar_codigo_xml(item.get("codigo_produto"))
        descricao_produto = str(item.get("descricao_produto") or "").strip()
        codigo_barras = _normalizar_codigo_xml(item.get("codigo_barras"))
        ncm = str(item.get("ncm") or "").strip()
        cest = str(item.get("cest") or "").strip()
        cfop = str(item.get("cfop") or "").strip()
        unidade_comercial = str(item.get("unidade_comercial") or "").strip()
        quantidade = _parse_decimal_flex(item.get("quantidade"))
        valor_unitario = _parse_decimal_flex(item.get("valor_unitario"), default="0")
        sugestoes = _montar_sugestao_item_nota(
            codigo_produto=codigo_produto,
            descricao_produto=descricao_produto,
            codigo_barras=codigo_barras,
            ncm=ncm,
            cest=cest,
            cfop=cfop,
            unidade_comercial=unidade_comercial,
            quantidade=quantidade,
            valor_unitario=valor_unitario,
            fornecedor_existente=fornecedor_existente,
            fornecedor_nome=fornecedor_nome,
        )

        itens.append(
            {
                "indice": int(item.get("indice") or len(itens) + 1),
                "codigo_produto": codigo_produto,
                "descricao_produto": descricao_produto,
                "codigo_barras": codigo_barras,
                "ncm": ncm,
                "cest": cest,
                "cfop": cfop,
                "unidade_comercial": unidade_comercial,
                "quantidade": f"{quantidade:.4f}",
                "valor_unitario": f"{valor_unitario:.4f}",
                "possui_quantidade_fracionada": quantidade != quantidade.to_integral_value(),
                **sugestoes,
            }
        )

    importacao_existente = _buscar_importacao_existente_por_nota(
        chave_acesso=chave_acesso,
        numero=numero,
        serie=serie,
        fornecedor_nome=fornecedor_nome,
        fornecedor_documento=fornecedor_documento,
        data_emissao=data_emissao,
    )
    resumo = _montar_resumo_preview(itens)

    return {
        "nota": {
            "chave_acesso": chave_acesso,
            "numero": str(numero or "").strip(),
            "serie": str(serie or "").strip(),
            "fornecedor_nome": fornecedor_nome,
            "fornecedor_documento": fornecedor_documento,
            "data_emissao": data_emissao.isoformat() if data_emissao else None,
            "arquivo_nome": arquivo_nome,
            "tipo_arquivo": tipo_arquivo,
            "modo_leitura": modo_leitura,
            "requer_conferencia_manual": requer_conferencia_manual,
            "ja_importada": bool(importacao_existente),
            "importacao_existente_id": (
                importacao_existente.id if importacao_existente else None
            ),
            "resumo": resumo,
        },
        "fornecedor": {
            "existente_id": fornecedor_existente.id if fornecedor_existente else None,
            "existente_nome": fornecedor_existente.nome if fornecedor_existente else "",
            "sugestao_modo": "usar_existente" if fornecedor_existente else "criar",
            "cadastro_sugerido": {
                "nome": fornecedor_nome,
                "documento": fornecedor_documento,
                "contato": "",
                "telefone": "",
                "email": "",
            },
        },
        "itens": itens,
    }


def _extrair_strings_pdf(stream_bytes):
    strings = []
    index = 0
    length = len(stream_bytes)

    while index < length:
        if stream_bytes[index] != 40:
            index += 1
            continue

        depth = 1
        index += 1
        fragment = bytearray()

        while index < length and depth > 0:
            byte = stream_bytes[index]

            if byte == 92:
                fragment.append(byte)
                index += 1
                if index < length:
                    fragment.append(stream_bytes[index])
                index += 1
                continue

            if byte == 40:
                depth += 1
                fragment.append(byte)
                index += 1
                continue

            if byte == 41:
                depth -= 1
                if depth == 0:
                    index += 1
                    break
                fragment.append(byte)
                index += 1
                continue

            fragment.append(byte)
            index += 1

        strings.append(_decodificar_string_pdf(bytes(fragment)))

    return strings


def _decodificar_string_pdf(fragment):
    decoded = bytearray()
    index = 0
    length = len(fragment)

    while index < length:
        byte = fragment[index]
        if byte != 92:
            decoded.append(byte)
            index += 1
            continue

        index += 1
        if index >= length:
            break

        escaped = fragment[index]
        escape_map = {
            ord("n"): ord("\n"),
            ord("r"): ord("\r"),
            ord("t"): ord("\t"),
            ord("b"): ord("\b"),
            ord("f"): ord("\f"),
            ord("("): ord("("),
            ord(")"): ord(")"),
            ord("\\"): ord("\\"),
        }

        if escaped in escape_map:
            decoded.append(escape_map[escaped])
            index += 1
            continue

        if escaped in {10, 13}:
            index += 1
            if escaped == 13 and index < length and fragment[index] == 10:
                index += 1
            continue

        if 48 <= escaped <= 55:
            octal_digits = [escaped]
            index += 1
            for _ in range(2):
                if index < length and 48 <= fragment[index] <= 55:
                    octal_digits.append(fragment[index])
                    index += 1
                else:
                    break
            decoded.append(int(bytes(octal_digits), 8))
            continue

        decoded.append(escaped)
        index += 1

    return decoded.decode("latin-1", "ignore")


def _extrair_xml_embutido_pdf(pdf_bytes):
    xml_match = re.search(
        rb"<(?:\?xml.*?\?>)?\s*(?:nfeProc|NFe)\b.*?(?:</nfeProc>|</NFe>)",
        pdf_bytes,
        re.DOTALL,
    )
    if not xml_match:
        return None

    return xml_match.group(0)


def _extrair_texto_pdf(pdf_bytes):
    partes = []

    for match in PDF_STREAM_PATTERN.finditer(pdf_bytes):
        header = match.group("header")
        stream = match.group("stream")

        if b"/FlateDecode" in header:
            try:
                stream = zlib.decompress(stream)
            except zlib.error:
                continue

        if b"BT" not in stream and b"Tj" not in stream and b"TJ" not in stream:
            continue

        strings = [texto for texto in _extrair_strings_pdf(stream) if texto.strip()]
        if strings:
            partes.append("\n".join(strings))

    if not partes:
        partes.append(pdf_bytes.decode("latin-1", "ignore"))

    texto = "\n".join(parte for parte in partes if parte.strip())
    texto = texto.replace("\x00", " ")
    texto = re.sub(r"[ \t]+", " ", texto)
    texto = re.sub(r"\n{2,}", "\n", texto)
    return texto.strip()


def _buscar_valor_texto(texto, patterns):
    for pattern in patterns:
        match = re.search(pattern, texto, re.IGNORECASE | re.MULTILINE)
        if match:
            valor = match.group(1) if match.lastindex else match.group(0)
            return valor.strip()
    return ""


def _buscar_linha_por_rotulo(linhas, rotulos):
    for index, linha in enumerate(linhas):
        linha_normalizada = _normalizar_texto_livre(linha)
        if any(rotulo in linha_normalizada for rotulo in rotulos):
            if ":" in linha:
                linha_original = linha.split(":", 1)[1].strip()
                if linha_original:
                    return linha_original

            for prox_linha in linhas[index + 1 : index + 4]:
                prox_linha = prox_linha.strip()
                if not prox_linha:
                    continue
                if CNPJ_PATTERN.search(prox_linha):
                    continue
                if "serie" in _normalizar_texto_livre(prox_linha):
                    continue
                return prox_linha

    return ""


def _extrair_itens_pdf(linhas):
    itens = []

    for linha in linhas:
        conteudo = linha.strip()
        if not conteudo:
            continue

        linha_normalizada = _normalizar_texto_livre(conteudo)
        if any(
            termo in linha_normalizada
            for termo in (
                "total",
                "base calculo",
                "valor icms",
                "dados adicionais",
                "transportador",
                "calculo imposto",
            )
        ):
            continue

        for pattern in ITEM_PDF_PATTERNS:
            match = pattern.match(conteudo)
            if not match:
                continue

            indice = match.groupdict().get("indice") or len(itens) + 1
            itens.append(
                {
                    "indice": int(indice),
                    "codigo_produto": match.group("codigo"),
                    "descricao_produto": re.sub(
                        r"\s+",
                        " ",
                        match.group("descricao"),
                    ).strip(" -"),
                    "quantidade": match.group("quantidade"),
                    "valor_unitario": match.group("valor_unitario"),
                }
            )
            break

    return itens


def _parse_pdf_nota_por_texto(*, texto_pdf, arquivo_nome):
    linhas = [linha.strip() for linha in texto_pdf.splitlines() if linha.strip()]

    fornecedor_nome = _buscar_linha_por_rotulo(
        linhas,
        ("nome razao social", "emitente", "fornecedor"),
    )
    fornecedor_documento = _buscar_valor_texto(texto_pdf, (CNPJ_PATTERN.pattern,))
    numero = _buscar_valor_texto(
        texto_pdf,
        (
            r"\bN[OUº°]*\s*(?:DA NOTA|NF[ -]?E)?\s*[:#]?\s*(\d{1,9})",
            r"\bNUMERO\s*[:#]?\s*(\d{1,9})",
        ),
    )
    serie = _buscar_valor_texto(
        texto_pdf,
        (
            r"\bSERIE\s*[:#]?\s*([A-Z0-9-]{1,6})",
            r"\bSER\s*[:#]?\s*([A-Z0-9-]{1,6})",
        ),
    )
    data_emissao = _parse_data_emissao_flex(
        _buscar_valor_texto(
            texto_pdf,
            (
                r"\bDATA(?: DE)? EMISSAO\s*[:#]?\s*([0-3]?\d/[01]?\d/\d{4}(?:\s+\d{2}:\d{2}(?::\d{2})?)?)",
                r"\bEMISSAO\s*[:#]?\s*([0-3]?\d/[01]?\d/\d{4}(?:\s+\d{2}:\d{2}(?::\d{2})?)?)",
            ),
        )
    )
    chave_acesso = _buscar_valor_texto(texto_pdf, (CHAVE_ACESSO_PATTERN.pattern,))
    itens = _extrair_itens_pdf(linhas)

    if not fornecedor_nome:
        raise ValidationError(
            {
                "arquivo": (
                    "Nao foi possivel identificar o fornecedor no PDF. "
                    "Use um DANFE com texto pesquisavel ou o XML da nota."
                )
            }
        )

    if not itens:
        raise ValidationError(
            {
                "arquivo": (
                    "Nao foi possivel ler os itens do PDF. "
                    "Use um DANFE com texto pesquisavel ou o XML da nota."
                )
            }
        )

    return _construir_preview_nota(
        chave_acesso=chave_acesso or None,
        numero=numero,
        serie=serie,
        fornecedor_nome=fornecedor_nome,
        fornecedor_documento=fornecedor_documento,
        data_emissao=data_emissao,
        arquivo_nome=arquivo_nome,
        itens_brutos=itens,
        tipo_arquivo="pdf",
        modo_leitura="texto_pdf",
        requer_conferencia_manual=True,
    )


def parse_xml_nota_fiscal(arquivo):
    try:
        xml_bytes = arquivo.read()
        root = ElementTree.fromstring(xml_bytes)
    except ElementTree.ParseError as error:
        raise ValidationError({"arquivo": "Nao foi possivel ler o XML da nota fiscal."}) from error
    finally:
        arquivo.seek(0)

    inf_nfe = root.find(".//{*}infNFe")
    if inf_nfe is None:
        raise ValidationError({"arquivo": "O XML enviado nao contem uma NF-e valida."})

    ide = inf_nfe.find("./{*}ide")
    emit = inf_nfe.find("./{*}emit")

    chave_acesso = inf_nfe.attrib.get("Id", "").replace("NFe", "").strip() or None
    data_emissao = _parse_data_emissao(
        _get_text(ide, "./{*}dhEmi") or _get_text(ide, "./{*}dEmi")
    )
    fornecedor_nome = _get_text(emit, "./{*}xNome")
    fornecedor_documento = _get_text(emit, "./{*}CNPJ") or _get_text(emit, "./{*}CPF")
    itens_brutos = []
    for ordem, det in enumerate(inf_nfe.findall("./{*}det"), start=1):
        prod = det.find("./{*}prod")
        if prod is None:
            continue

        itens_brutos.append(
            {
                "indice": int(det.attrib.get("nItem") or ordem),
                "codigo_produto": _normalizar_codigo_xml(_get_text(prod, "./{*}cProd")),
                "descricao_produto": _get_text(prod, "./{*}xProd"),
                "codigo_barras": _normalizar_codigo_xml(
                    _get_text(prod, "./{*}cEAN") or _get_text(prod, "./{*}cEANTrib")
                ),
                "ncm": _get_text(prod, "./{*}NCM"),
                "cest": _get_text(prod, "./{*}CEST"),
                "cfop": _get_text(prod, "./{*}CFOP"),
                "unidade_comercial": _get_text(prod, "./{*}uCom")
                or _get_text(prod, "./{*}uTrib"),
                "quantidade": _get_text(prod, "./{*}qCom"),
                "valor_unitario": _get_text(prod, "./{*}vUnCom"),
            }
        )

    return _construir_preview_nota(
        chave_acesso=chave_acesso,
        numero=_get_text(ide, "./{*}nNF"),
        serie=_get_text(ide, "./{*}serie"),
        fornecedor_nome=fornecedor_nome,
        fornecedor_documento=fornecedor_documento,
        data_emissao=data_emissao,
        arquivo_nome=getattr(arquivo, "name", ""),
        itens_brutos=itens_brutos,
        tipo_arquivo="xml",
        modo_leitura="xml",
        requer_conferencia_manual=False,
    )


def parse_pdf_nota_fiscal(arquivo):
    try:
        pdf_bytes = arquivo.read()
    finally:
        arquivo.seek(0)

    if not pdf_bytes.startswith(b"%PDF"):
        raise ValidationError({"arquivo": "O arquivo PDF enviado nao e valido."})

    xml_embutido = _extrair_xml_embutido_pdf(pdf_bytes)
    if xml_embutido:
        class _ArquivoTemporario:
            def __init__(self, conteudo, nome):
                self._conteudo = conteudo
                self.name = nome

            def read(self):
                return self._conteudo

            def seek(self, *_args, **_kwargs):
                return None

        preview = parse_xml_nota_fiscal(
            _ArquivoTemporario(xml_embutido, getattr(arquivo, "name", "nota.pdf"))
        )
        preview["nota"]["tipo_arquivo"] = "pdf"
        preview["nota"]["modo_leitura"] = "xml_embutido_no_pdf"
        preview["nota"]["requer_conferencia_manual"] = True
        return preview

    texto_pdf = _extrair_texto_pdf(pdf_bytes)
    if not texto_pdf:
        raise ValidationError(
            {
                "arquivo": (
                    "Nao foi possivel extrair texto do PDF. "
                    "Use um PDF com texto pesquisavel ou o XML da nota."
                )
            }
        )

    return _parse_pdf_nota_por_texto(
        texto_pdf=texto_pdf,
        arquivo_nome=getattr(arquivo, "name", ""),
    )


def parse_nota_fiscal(arquivo):
    if _arquivo_eh_pdf(arquivo):
        return parse_pdf_nota_fiscal(arquivo)
    return parse_xml_nota_fiscal(arquivo)


def _validar_mapeamentos_itens(itens, mapeamentos):
    if not itens:
        raise ValidationError({"arquivo": "A nota fiscal nao possui itens para importar."})

    indices_recebidos = [item["indice"] for item in mapeamentos]
    indices_duplicados = sorted(
        indice for indice, total in Counter(indices_recebidos).items() if total > 1
    )
    if indices_duplicados:
        raise ValidationError(
            {
                "mapeamentos": (
                    "Existem itens repetidos no envio dos mapeamentos: "
                    + ", ".join(str(indice) for indice in indices_duplicados)
                )
            }
        )

    itens_por_indice = {item["indice"]: item for item in itens}
    mapeamentos_por_indice = {item["indice"]: item for item in mapeamentos}

    indices_faltantes = sorted(set(itens_por_indice) - set(mapeamentos_por_indice))
    if indices_faltantes:
        raise ValidationError(
            {
                "mapeamentos": (
                    "Existem itens da nota sem resolucao definida: "
                    + ", ".join(str(indice) for indice in indices_faltantes)
                )
            }
        )

    indices_invalidos = sorted(set(mapeamentos_por_indice) - set(itens_por_indice))
    if indices_invalidos:
        raise ValidationError(
            {
                "mapeamentos": (
                    "Existem resolucoes para itens que nao pertencem a nota: "
                    + ", ".join(str(indice) for indice in indices_invalidos)
                )
            }
        )

    return itens_por_indice, mapeamentos_por_indice


def _resolver_fornecedor_importacao(*, nota_fornecedor, fornecedor_resolucao):
    modo = fornecedor_resolucao.get("modo", "manter")

    if modo == "manter":
        return None

    if modo == "usar_existente":
        return fornecedor_resolucao["fornecedor"]

    nome = _to_optional_text(fornecedor_resolucao.get("nome")) or nota_fornecedor["nome"]
    documento = (
        _to_optional_text(fornecedor_resolucao.get("documento"))
        or nota_fornecedor["documento"]
    )
    contato = _to_optional_text(fornecedor_resolucao.get("contato"))
    telefone = _to_optional_text(fornecedor_resolucao.get("telefone"))
    email = _to_optional_text(fornecedor_resolucao.get("email"))

    fornecedor_existente = _buscar_fornecedor_existente(nome, documento)
    if fornecedor_existente:
        atualizacoes = []

        if documento and not fornecedor_existente.documento:
            fornecedor_existente.documento = documento
            atualizacoes.append("documento")
        if contato and not fornecedor_existente.contato:
            fornecedor_existente.contato = contato
            atualizacoes.append("contato")
        if telefone and not fornecedor_existente.telefone:
            fornecedor_existente.telefone = telefone
            atualizacoes.append("telefone")
        if email and not fornecedor_existente.email:
            fornecedor_existente.email = email
            atualizacoes.append("email")

        if atualizacoes:
            fornecedor_existente.save(update_fields=atualizacoes)

        return fornecedor_existente

    return Fornecedor.objects.create(
        nome=nome,
        documento=documento,
        contato=contato,
        telefone=telefone,
        email=email,
    )


def _criar_variacao_importacao(*, produto, dados):
    variacao = Variacao(
        produto=produto,
        cor=_to_optional_text(dados.get("cor")),
        tamanho=_to_optional_text(dados.get("tamanho")),
        numeracao=_to_optional_text(dados.get("numeracao")),
        saldo_atual=0,
    )
    variacao.save()
    return variacao


def _criar_produto_importacao(*, dados, fornecedor_padrao=None):
    fornecedor = dados.get("fornecedor") or fornecedor_padrao
    produto = Produto(
        nome=str(dados["nome"]).strip(),
        marca=str(dados["marca"]).strip(),
        categoria=dados["categoria"],
        subcategoria=dados["subcategoria"],
        sku=str(dados["sku"]).strip(),
        codigo_barras=_to_optional_text(dados.get("codigo_barras")),
        ncm=_to_optional_text(dados.get("ncm")),
        cest=_to_optional_text(dados.get("cest")),
        cfop=_to_optional_text(dados.get("cfop")),
        unidade_comercial=_to_optional_text(dados.get("unidade_comercial")),
        fornecedor=fornecedor,
        preco_custo=dados.get("preco_custo"),
        preco_venda=dados["preco_venda"],
        estoque_minimo=dados.get("estoque_minimo", 0) or 0,
    )
    produto.save()

    variacao = _criar_variacao_importacao(produto=produto, dados=dados)
    return produto, variacao


def _resolver_variacao_importacao(*, mapeamento, fornecedor_resolvido=None):
    if mapeamento.get("variacao"):
        return mapeamento["variacao"]

    if mapeamento.get("nova_variacao"):
        dados = mapeamento["nova_variacao"]
        return _criar_variacao_importacao(produto=dados["produto"], dados=dados)

    if mapeamento.get("novo_produto"):
        _, variacao = _criar_produto_importacao(
            dados=mapeamento["novo_produto"],
            fornecedor_padrao=fornecedor_resolvido,
        )
        return variacao

    raise ValidationError(
        {
            "mapeamentos": (
                "Nao foi possivel resolver o item informado. "
                "Escolha uma variacao existente ou conclua o cadastro."
            )
        }
    )


@transaction.atomic
def aplicar_importacao_nota_fiscal(
    *,
    arquivo,
    mapeamentos,
    fornecedor_resolucao=None,
    usuario=None,
):
    preview = parse_nota_fiscal(arquivo)
    nota = preview["nota"]
    itens = preview["itens"]

    importacao_existente = _buscar_importacao_existente_por_nota(
        chave_acesso=nota["chave_acesso"],
        numero=nota["numero"],
        serie=nota["serie"],
        fornecedor_nome=nota["fornecedor_nome"],
        fornecedor_documento=nota["fornecedor_documento"],
        data_emissao=_parse_data_emissao(nota["data_emissao"]),
    )
    if importacao_existente is not None:
        raise ValidationError(
            {
                "arquivo": (
                    "Esta nota fiscal ja foi importada anteriormente. "
                    f"Importacao encontrada: #{importacao_existente.id}."
                )
            }
        )

    itens_por_indice, mapeamentos_por_indice = _validar_mapeamentos_itens(itens, mapeamentos)
    fornecedor_importacao = _resolver_fornecedor_importacao(
        nota_fornecedor={
            "nome": nota["fornecedor_nome"],
            "documento": nota["fornecedor_documento"],
        },
        fornecedor_resolucao=fornecedor_resolucao or {"modo": "manter"},
    )

    importacao = ImportacaoNotaFiscal.objects.create(
        chave_acesso=nota["chave_acesso"],
        numero=nota["numero"],
        serie=nota["serie"],
        fornecedor_nome=nota["fornecedor_nome"],
        fornecedor_documento=nota["fornecedor_documento"],
        data_emissao=_parse_data_emissao(nota["data_emissao"]),
        arquivo_nome=nota["arquivo_nome"],
        importado_por=usuario,
    )

    movimentacoes = []
    for indice in sorted(itens_por_indice):
        item = itens_por_indice[indice]
        mapeamento = mapeamentos_por_indice[indice]
        quantidade_decimal = Decimal(item["quantidade"])

        if quantidade_decimal != quantidade_decimal.to_integral_value():
            raise ValidationError(
                {
                    "mapeamentos": (
                        f"O item {indice} possui quantidade fracionada e nao pode "
                        "ser lancado automaticamente no estoque."
                    )
                }
            )

        variacao = _resolver_variacao_importacao(
            mapeamento=mapeamento,
            fornecedor_resolvido=fornecedor_importacao,
        )

        movimentacao, _ = registrar_movimentacao(
            variacao=variacao,
            tipo=Movimentacao.Tipo.ENTRADA,
            quantidade=int(quantidade_decimal),
            observacao=(
                f"Entrada via importacao NF-e {nota['numero']}/{nota['serie']} - "
                f"{item['descricao_produto']}"
            ),
            usuario=usuario,
        )
        movimentacoes.append(movimentacao)

        ImportacaoNotaFiscalItem.objects.create(
            importacao=importacao,
            indice=indice,
            codigo_produto=item["codigo_produto"],
            descricao_produto=item["descricao_produto"],
            quantidade=quantidade_decimal,
            valor_unitario=Decimal(item["valor_unitario"]),
            variacao=variacao,
            movimentacao=movimentacao,
        )

    return {
        "importacao_id": importacao.id,
        "numero": importacao.numero,
        "serie": importacao.serie,
        "fornecedor_id": fornecedor_importacao.id if fornecedor_importacao else None,
        "itens_importados": len(movimentacoes),
        "movimentacoes_ids": [movimentacao.id for movimentacao in movimentacoes],
    }


@transaction.atomic
def limpar_importacao_nota_fiscal(*, importacao_id, usuario=None):
    try:
        importacao = (
            ImportacaoNotaFiscal.objects.select_for_update()
            .prefetch_related(
                "itens",
                "itens__variacao",
                "itens__variacao__produto",
            )
            .get(pk=importacao_id)
        )
    except ImportacaoNotaFiscal.DoesNotExist as error:
        raise ValidationError({"detail": "Importacao de nota fiscal nao encontrada."}) from error

    itens = list(importacao.itens.all().order_by("indice", "id"))
    movimentacoes_estorno = []
    itens_sem_vinculo = []

    for item in itens:
        quantidade_decimal = Decimal(item.quantidade or 0)
        if quantidade_decimal != quantidade_decimal.to_integral_value():
            raise ValidationError(
                {
                    "detail": (
                        "Nao foi possivel limpar a importacao porque o item "
                        f"{item.indice} possui quantidade fracionada."
                    )
                }
            )

        variacao_referencia = None
        if item.movimentacao_id:
            try:
                variacao_referencia = item.movimentacao.variacao
            except Movimentacao.DoesNotExist:
                variacao_referencia = None

        if variacao_referencia is None and item.variacao_id is not None:
            variacao_referencia = item.variacao

        if variacao_referencia is None:
            # Registros legados podem existir sem vinculo da variacao/movimentacao.
            # Nesse caso removemos o bloqueio historico da importacao sem tentar
            # estornar um estoque que nao conseguimos rastrear com seguranca.
            itens_sem_vinculo.append(item.indice)
            continue

        try:
            movimentacao, _ = registrar_movimentacao(
                variacao=variacao_referencia,
                tipo=Movimentacao.Tipo.SAIDA,
                quantidade=int(quantidade_decimal),
                observacao=(
                    f"Limpeza da importacao NF-e {importacao.numero}/{importacao.serie} - "
                    f"{item.descricao_produto}"
                ),
                usuario=usuario,
            )
        except ValidationError as error:
            if getattr(error, "message_dict", {}).get("quantidade"):
                raise ValidationError(
                    {
                        "detail": (
                            "Nao foi possivel limpar a importacao porque o estoque atual "
                            f"de {variacao_referencia.produto.nome} e insuficiente para estornar "
                            f"{int(quantidade_decimal)} unidade(s)."
                        )
                    }
                ) from error
            raise

        movimentacoes_estorno.append(movimentacao)

    importacao.delete()

    return {
        "importacao_id": importacao_id,
        "itens_estornados": len(movimentacoes_estorno),
        "itens_sem_vinculo": len(itens_sem_vinculo),
        "indices_sem_vinculo": itens_sem_vinculo,
        "movimentacoes_estorno_ids": [movimentacao.id for movimentacao in movimentacoes_estorno],
    }
