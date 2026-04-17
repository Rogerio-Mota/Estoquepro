import json
from datetime import timedelta

from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from django.test import TestCase
from rest_framework.test import APIClient

from .models import (
    ConfiguracaoSistema,
    Fornecedor,
    ImportacaoNotaFiscal,
    ImportacaoNotaFiscalItem,
    Movimentacao,
    PedidoVenda,
    PedidoVendaItem,
    PerfilUsuario,
    Produto,
    Variacao,
)
from .services import registrar_movimentacao


class RegistroMovimentacaoTests(TestCase):
    def setUp(self):
        self.produto = Produto.objects.create(
            nome="Camisa Polo",
            categoria=Produto.Categoria.ROUPA,
            subcategoria=Produto.Subcategoria.CAMISA,
            marca="Marca X",
            sku="CAM-001",
            preco_custo="40.00",
            preco_venda="79.90",
            estoque_minimo=2,
        )
        self.variacao = Variacao.objects.create(
            produto=self.produto,
            cor="Azul",
            tamanho=Variacao.Tamanho.M,
            saldo_atual=5,
        )

    def test_registrar_entrada_atualiza_saldo_e_cria_movimentacao(self):
        movimentacao, variacao = registrar_movimentacao(
            variacao=self.variacao,
            tipo=Movimentacao.Tipo.ENTRADA,
            quantidade=3,
            observacao="Reposicao",
        )

        self.assertEqual(movimentacao.tipo, Movimentacao.Tipo.ENTRADA)
        self.assertEqual(variacao.saldo_atual, 8)
        self.assertEqual(Movimentacao.objects.count(), 1)

    def test_registrar_saida_sem_estoque_disponivel_bloqueia_operacao(self):
        with self.assertRaises(ValidationError):
            registrar_movimentacao(
                variacao=self.variacao,
                tipo=Movimentacao.Tipo.SAIDA,
                quantidade=10,
            )

        self.variacao.refresh_from_db()
        self.assertEqual(self.variacao.saldo_atual, 5)
        self.assertEqual(Movimentacao.objects.count(), 0)

    def test_registrar_movimentacao_guarda_o_responsavel(self):
        usuario = User.objects.create_user(username="estoquista", password="123456")

        movimentacao, _ = registrar_movimentacao(
            variacao=self.variacao,
            tipo=Movimentacao.Tipo.ENTRADA,
            quantidade=1,
            observacao="Ajuste manual",
            usuario=usuario,
        )

        self.assertEqual(movimentacao.responsavel, usuario)


class PrimeiroAcessoTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_primeiro_acesso_cria_administrador_inicial(self):
        status_response = self.client.get("/api/primeiro-acesso/")

        self.assertEqual(status_response.status_code, 200)
        self.assertTrue(status_response.data["primeiro_acesso_pendente"])

        create_response = self.client.post(
            "/api/primeiro-acesso/",
            {
                "username": "admininicial",
                "password": "123456",
                "password_confirmacao": "123456",
            },
            format="json",
        )

        self.assertEqual(create_response.status_code, 201)
        usuario = User.objects.get(username="admininicial")
        self.assertEqual(usuario.perfil.tipo, PerfilUsuario.Tipo.ADMIN)

        status_final_response = self.client.get("/api/primeiro-acesso/")
        self.assertEqual(status_final_response.status_code, 200)
        self.assertFalse(status_final_response.data["primeiro_acesso_pendente"])

    def test_primeiro_acesso_bloqueia_segunda_criacao(self):
        User.objects.create_superuser(
            username="root",
            password="123456",
            email="root@example.com",
        )

        response = self.client.post(
            "/api/primeiro-acesso/",
            {
                "username": "admin2",
                "password": "123456",
                "password_confirmacao": "123456",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("detail", response.data)


class VariacaoAutomaticaTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create_user(username="adminestoque", password="123456")
        self.admin_user.perfil.tipo = PerfilUsuario.Tipo.ADMIN
        self.admin_user.perfil.save(update_fields=["tipo"])
        self.client.force_authenticate(user=self.admin_user)

        self.produto = Produto.objects.create(
            nome="Camisa Dry Fit",
            categoria=Produto.Categoria.ROUPA,
            subcategoria=Produto.Subcategoria.CAMISA,
            marca="Marca Flow",
            sku="CAM-777",
            preco_custo="35.00",
            preco_venda="69.90",
            estoque_minimo=1,
        )

    def test_criar_variacao_com_estoque_inicial_registra_entrada_automatica(self):
        response = self.client.post(
            "/api/variacoes/",
            {
                "produto": self.produto.id,
                "cor": "Preta",
                "tamanho": Variacao.Tamanho.M,
                "estoque_inicial": 4,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        variacao = Variacao.objects.get(pk=response.data["id"])
        self.assertEqual(variacao.saldo_atual, 4)

        movimentacao = Movimentacao.objects.get(variacao=variacao)
        self.assertEqual(movimentacao.tipo, Movimentacao.Tipo.ENTRADA)
        self.assertEqual(movimentacao.quantidade, 4)

    def test_atualizacao_de_variacao_nao_aceita_estoque_inicial(self):
        variacao = Variacao.objects.create(
            produto=self.produto,
            cor="Azul",
            tamanho=Variacao.Tamanho.G,
            saldo_atual=0,
        )

        response = self.client.patch(
            f"/api/variacoes/{variacao.id}/",
            {"estoque_inicial": 2},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("estoque_inicial", response.data)
        variacao.refresh_from_db()
        self.assertEqual(variacao.saldo_atual, 0)
        self.assertEqual(Movimentacao.objects.count(), 0)


class ProdutoDuplicadoTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create_user(username="adminproduto", password="123456")
        self.admin_user.perfil.tipo = PerfilUsuario.Tipo.ADMIN
        self.admin_user.perfil.save(update_fields=["tipo"])
        self.client.force_authenticate(user=self.admin_user)

        self.fornecedor = Fornecedor.objects.create(nome="Fornecedor Teste")
        self.payload_base = {
            "nome": "Camisa Básica",
            "marca": "Marca Y",
            "categoria": Produto.Categoria.ROUPA,
            "subcategoria": Produto.Subcategoria.CAMISA,
            "sku": "cam-001",
            "preco_custo": "20.00",
            "preco_venda": "39.90",
            "estoque_minimo": 1,
            "fornecedor": self.fornecedor.id,
        }

    def test_nao_permite_repetir_sku_com_caixa_diferente(self):
        primeiro = self.client.post("/api/produtos/", self.payload_base, format="json")

        self.assertEqual(primeiro.status_code, 201)

        response = self.client.post(
            "/api/produtos/",
            {
                **self.payload_base,
                "nome": "Camisa Básica Nova",
                "sku": "CAM-001",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("sku", response.data)

    def test_nao_permite_repetir_mesmo_produto_com_sku_diferente(self):
        primeiro = self.client.post("/api/produtos/", self.payload_base, format="json")

        self.assertEqual(primeiro.status_code, 201)

        response = self.client.post(
            "/api/produtos/",
            {
                **self.payload_base,
                "sku": "CAM-002",
                "nome": "  camisa básica  ",
                "marca": "marca y",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("nome", response.data)


class ImportacaoNotaFiscalTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username="operador", password="123456")
        self.client.force_authenticate(user=self.user)
        self.admin_user = User.objects.create_user(username="admin-import", password="123456")
        self.admin_user.perfil.tipo = PerfilUsuario.Tipo.ADMIN
        self.admin_user.perfil.save(update_fields=["tipo"])

        self.produto = Produto.objects.create(
            nome="Camisa Polo",
            categoria=Produto.Categoria.ROUPA,
            subcategoria=Produto.Subcategoria.CAMISA,
            marca="Marca X",
            sku="CAM-001",
            preco_custo="40.00",
            preco_venda="79.90",
            estoque_minimo=2,
        )
        self.variacao = Variacao.objects.create(
            produto=self.produto,
            cor="Azul",
            tamanho=Variacao.Tamanho.M,
            saldo_atual=5,
        )

    def _build_xml_file(self):
        xml_content = b"""<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe">
  <NFe>
    <infNFe Id="NFe12345678901234567890123456789012345678901234" versao="4.00">
      <ide>
        <nNF>123</nNF>
        <serie>1</serie>
        <dhEmi>2026-04-08T10:00:00-03:00</dhEmi>
      </ide>
      <emit>
        <xNome>Fornecedor XPTO</xNome>
        <CNPJ>12345678000199</CNPJ>
      </emit>
      <det nItem="1">
        <prod>
          <cProd>CAM-001</cProd>
          <xProd>Camisa Polo Azul M</xProd>
          <qCom>3.0000</qCom>
          <vUnCom>50.0000</vUnCom>
        </prod>
      </det>
    </infNFe>
  </NFe>
</nfeProc>"""
        return SimpleUploadedFile("nfe.xml", xml_content, content_type="text/xml")

    def _build_new_product_xml_file(self):
        xml_content = b"""<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe">
  <NFe>
    <infNFe Id="NFe99999999999999999999999999999999999999999999" versao="4.00">
      <ide>
        <nNF>456</nNF>
        <serie>1</serie>
        <dhEmi>2026-04-08T11:00:00-03:00</dhEmi>
      </ide>
      <emit>
        <xNome>Fornecedor Novo LTDA</xNome>
        <CNPJ>99887766000155</CNPJ>
      </emit>
      <det nItem="1">
        <prod>
          <cProd>TEN-777</cProd>
          <cEAN>7891234567890</cEAN>
          <xProd>Tenis Preto 42</xProd>
          <NCM>64041100</NCM>
          <CEST>1234567</CEST>
          <CFOP>1102</CFOP>
          <uCom>UN</uCom>
          <qCom>2.0000</qCom>
          <vUnCom>120.0000</vUnCom>
        </prod>
      </det>
    </infNFe>
  </NFe>
</nfeProc>"""
        return SimpleUploadedFile("nfe-novo.xml", xml_content, content_type="text/xml")

    def _build_generic_xml_file(self):
        xml_content = b"""<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe">
  <NFe>
    <infNFe Id="NFe88888888888888888888888888888888888888888888" versao="4.00">
      <ide>
        <nNF>888</nNF>
        <serie>1</serie>
        <dhEmi>2026-04-08T11:30:00-03:00</dhEmi>
      </ide>
      <emit>
        <xNome>Fornecedor Obra LTDA</xNome>
        <CNPJ>44556677000188</CNPJ>
      </emit>
      <det nItem="1">
        <prod>
          <cProd>ARG-020</cProd>
          <cEAN>7890001112223</cEAN>
          <xProd>ARGAMASSA 20KG AC3</xProd>
          <NCM>32149000</NCM>
          <CEST>2812345</CEST>
          <CFOP>1102</CFOP>
          <uCom>SC</uCom>
          <qCom>4.0000</qCom>
          <vUnCom>35.0000</vUnCom>
        </prod>
      </det>
    </infNFe>
  </NFe>
</nfeProc>"""
        return SimpleUploadedFile("nfe-generica.xml", xml_content, content_type="text/xml")

    def _build_description_match_xml_file(self):
        xml_content = b"""<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe">
  <NFe>
    <infNFe Id="NFe55555555555555555555555555555555555555555555" versao="4.00">
      <ide>
        <nNF>555</nNF>
        <serie>1</serie>
        <dhEmi>2026-04-08T12:30:00-03:00</dhEmi>
      </ide>
      <emit>
        <xNome>Fornecedor XPTO</xNome>
        <CNPJ>12345678000199</CNPJ>
      </emit>
      <det nItem="1">
        <prod>
          <cProd>CODIGO-EXTERNO-999</cProd>
          <xProd>Camisa Polo Azul M</xProd>
          <qCom>1.0000</qCom>
          <vUnCom>50.0000</vUnCom>
        </prod>
      </det>
    </infNFe>
  </NFe>
</nfeProc>"""
        return SimpleUploadedFile(
            "nfe-descricao.xml",
            xml_content,
            content_type="text/xml",
        )

    def _build_pdf_file(self):
        pdf_content = b"""%PDF-1.4
1 0 obj
<< /Length 294 >>
stream
BT
/F1 12 Tf
72 720 Td
(NOME RAZAO SOCIAL) Tj
0 -16 Td
(Fornecedor PDF LTDA) Tj
0 -16 Td
(CNPJ 11222333000144) Tj
0 -16 Td
(NUMERO 789) Tj
0 -16 Td
(SERIE 1) Tj
0 -16 Td
(EMISSAO 08/04/2026 10:00) Tj
0 -16 Td
(ITEM 1 CODIGO CAM-001 DESCRICAO Camisa Polo Azul M QTD 2 VUN 50,00) Tj
ET
endstream
endobj
%%EOF"""
        return SimpleUploadedFile("nfe.pdf", pdf_content, content_type="application/pdf")

    def test_preview_nota_fiscal_retorna_item_e_sugestao_de_variacao(self):
        response = self.client.post(
            "/api/importacao-nota-fiscal/preview/",
            {"arquivo": self._build_xml_file()},
            format="multipart",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["nota"]["numero"], "123")
        self.assertEqual(len(response.data["itens"]), 1)
        self.assertEqual(response.data["itens"][0]["variacao_sugerida_id"], self.variacao.id)
        self.assertEqual(response.data["nota"]["resumo"]["variacoes_existentes"], 1)

    def test_preview_nota_fiscal_pode_sugerir_produto_por_descricao(self):
        response = self.client.post(
            "/api/importacao-nota-fiscal/preview/",
            {"arquivo": self._build_description_match_xml_file()},
            format="multipart",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["itens"][0]["produto_existente"]["id"], self.produto.id)
        self.assertEqual(response.data["itens"][0]["criterio_sugestao"], "descricao")
        self.assertEqual(response.data["itens"][0]["variacao_sugerida_id"], self.variacao.id)
        self.assertIn("descricao", " ".join(response.data["itens"][0]["avisos"]).lower())

    def test_aplicar_importacao_nf_atualiza_estoque_e_bloqueia_duplicidade(self):
        response = self.client.post(
            "/api/importacao-nota-fiscal/aplicar/",
            {
                "arquivo": self._build_xml_file(),
                "fornecedor": json.dumps({"modo": "manter"}),
                "mapeamentos": json.dumps(
                    [{"indice": 1, "variacao": self.variacao.id}]
                ),
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, 201)

        self.variacao.refresh_from_db()
        self.assertEqual(self.variacao.saldo_atual, 8)
        self.assertEqual(Movimentacao.objects.count(), 1)
        self.assertEqual(ImportacaoNotaFiscal.objects.count(), 1)

        duplicate_response = self.client.post(
            "/api/importacao-nota-fiscal/aplicar/",
            {
                "arquivo": self._build_xml_file(),
                "fornecedor": json.dumps({"modo": "manter"}),
                "mapeamentos": json.dumps(
                    [{"indice": 1, "variacao": self.variacao.id}]
                ),
            },
            format="multipart",
        )

        self.assertEqual(duplicate_response.status_code, 400)

    def test_importacao_nf_pode_criar_fornecedor_e_produto_novo(self):
        preview_response = self.client.post(
            "/api/importacao-nota-fiscal/preview/",
            {"arquivo": self._build_new_product_xml_file()},
            format="multipart",
        )

        self.assertEqual(preview_response.status_code, 200)
        self.assertEqual(preview_response.data["fornecedor"]["sugestao_modo"], "criar")
        self.assertEqual(preview_response.data["itens"][0]["acao_sugerida"], "novo_produto")
        self.assertEqual(
            preview_response.data["itens"][0]["novo_produto_sugerido"]["codigo_barras"],
            "7891234567890",
        )
        self.assertEqual(
            preview_response.data["itens"][0]["novo_produto_sugerido"]["ncm"],
            "64041100",
        )
        self.assertEqual(
            preview_response.data["itens"][0]["novo_produto_sugerido"]["unidade_comercial"],
            "UN",
        )

        apply_response = self.client.post(
            "/api/importacao-nota-fiscal/aplicar/",
            {
                "arquivo": self._build_new_product_xml_file(),
                "fornecedor": json.dumps(
                    {
                        "modo": "criar",
                        "nome": "Fornecedor Novo LTDA",
                        "documento": "99887766000155",
                    }
                ),
                "mapeamentos": json.dumps(
                    [
                        {
                            "indice": 1,
                            "novo_produto": {
                                "nome": "Tenis Preto 42",
                                "marca": "Fornecedor Novo LTDA",
                                "categoria": "calcado",
                                "subcategoria": "tenis",
                                "sku": "TEN-777",
                                "codigo_barras": "7891234567890",
                                "ncm": "64041100",
                                "cest": "1234567",
                                "cfop": "1102",
                                "unidade_comercial": "UN",
                                "preco_custo": "120.00",
                                "preco_venda": "120.00",
                                "estoque_minimo": 0,
                                "cor": "Preto",
                                "numeracao": "42",
                            },
                        }
                    ]
                ),
            },
            format="multipart",
        )

        self.assertEqual(apply_response.status_code, 201)
        self.assertEqual(Fornecedor.objects.filter(nome="Fornecedor Novo LTDA").count(), 1)

        produto = Produto.objects.get(sku="TEN-777")
        self.assertEqual(produto.fornecedor.nome, "Fornecedor Novo LTDA")
        self.assertEqual(produto.codigo_barras, "7891234567890")
        self.assertEqual(produto.ncm, "64041100")
        self.assertEqual(produto.cest, "1234567")
        self.assertEqual(produto.cfop, "1102")
        self.assertEqual(produto.unidade_comercial, "UN")
        self.assertEqual(produto.variacoes.count(), 1)
        self.assertEqual(produto.variacoes.first().saldo_atual, 2)

    def test_preview_nota_fiscal_preenche_produto_generico_com_dados_do_xml(self):
        response = self.client.post(
            "/api/importacao-nota-fiscal/preview/",
            {"arquivo": self._build_generic_xml_file()},
            format="multipart",
        )

        self.assertEqual(response.status_code, 200)
        item = response.data["itens"][0]
        self.assertEqual(item["acao_sugerida"], "novo_produto")
        self.assertEqual(item["novo_produto_sugerido"]["categoria"], "geral")
        self.assertEqual(item["novo_produto_sugerido"]["subcategoria"], "geral")
        self.assertEqual(item["novo_produto_sugerido"]["sku"], "ARG-020")
        self.assertEqual(item["novo_produto_sugerido"]["codigo_barras"], "7890001112223")
        self.assertEqual(item["novo_produto_sugerido"]["ncm"], "32149000")
        self.assertEqual(item["novo_produto_sugerido"]["cest"], "2812345")
        self.assertEqual(item["novo_produto_sugerido"]["cfop"], "1102")
        self.assertEqual(item["novo_produto_sugerido"]["unidade_comercial"], "SC")

    def test_preview_pdf_de_nfe_retorna_dados_da_nota(self):
        response = self.client.post(
            "/api/importacao-nota-fiscal/preview/",
            {"arquivo": self._build_pdf_file()},
            format="multipart",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["nota"]["tipo_arquivo"], "pdf")
        self.assertEqual(response.data["nota"]["numero"], "789")
        self.assertEqual(response.data["fornecedor"]["cadastro_sugerido"]["nome"], "Fornecedor PDF LTDA")
        self.assertEqual(len(response.data["itens"]), 1)
        self.assertEqual(response.data["itens"][0]["variacao_sugerida_id"], self.variacao.id)

    def test_importacao_pdf_aplica_entrada_no_estoque(self):
        response = self.client.post(
            "/api/importacao-nota-fiscal/aplicar/",
            {
                "arquivo": self._build_pdf_file(),
                "fornecedor": json.dumps({"modo": "manter"}),
                "mapeamentos": json.dumps([{"indice": 1, "variacao": self.variacao.id}]),
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, 201)
        self.variacao.refresh_from_db()
        self.assertEqual(self.variacao.saldo_atual, 7)

    def test_preview_e_aplicacao_bloqueiam_pdf_duplicado_por_assinatura(self):
        primeira_importacao = self.client.post(
            "/api/importacao-nota-fiscal/aplicar/",
            {
                "arquivo": self._build_pdf_file(),
                "fornecedor": json.dumps({"modo": "manter"}),
                "mapeamentos": json.dumps([{"indice": 1, "variacao": self.variacao.id}]),
            },
            format="multipart",
        )

        self.assertEqual(primeira_importacao.status_code, 201)

        preview_response = self.client.post(
            "/api/importacao-nota-fiscal/preview/",
            {"arquivo": self._build_pdf_file()},
            format="multipart",
        )
        self.assertEqual(preview_response.status_code, 200)
        self.assertTrue(preview_response.data["nota"]["ja_importada"])

        apply_response = self.client.post(
            "/api/importacao-nota-fiscal/aplicar/",
            {
                "arquivo": self._build_pdf_file(),
                "fornecedor": json.dumps({"modo": "manter"}),
                "mapeamentos": json.dumps([{"indice": 1, "variacao": self.variacao.id}]),
            },
            format="multipart",
        )

        self.assertEqual(apply_response.status_code, 400)
        self.assertIn("arquivo", apply_response.data)

    def test_admin_pode_limpar_importacao_e_reverter_estoque(self):
        apply_response = self.client.post(
            "/api/importacao-nota-fiscal/aplicar/",
            {
                "arquivo": self._build_xml_file(),
                "fornecedor": json.dumps({"modo": "manter"}),
                "mapeamentos": json.dumps([{"indice": 1, "variacao": self.variacao.id}]),
            },
            format="multipart",
        )

        self.assertEqual(apply_response.status_code, 201)
        importacao_id = apply_response.data["importacao_id"]

        self.client.force_authenticate(user=self.admin_user)
        limpar_response = self.client.delete(
            f"/api/importacao-nota-fiscal/{importacao_id}/limpar/"
        )

        self.assertEqual(limpar_response.status_code, 200)
        self.assertEqual(ImportacaoNotaFiscal.objects.count(), 0)

        self.variacao.refresh_from_db()
        self.assertEqual(self.variacao.saldo_atual, 5)
        self.assertEqual(Movimentacao.objects.count(), 2)
        self.assertTrue(
            Movimentacao.objects.filter(
                observacao__icontains="Limpeza da importacao NF-e"
            ).exists()
        )

    def test_somente_admin_pode_limpar_importacao(self):
        apply_response = self.client.post(
            "/api/importacao-nota-fiscal/aplicar/",
            {
                "arquivo": self._build_xml_file(),
                "fornecedor": json.dumps({"modo": "manter"}),
                "mapeamentos": json.dumps([{"indice": 1, "variacao": self.variacao.id}]),
            },
            format="multipart",
        )

        self.assertEqual(apply_response.status_code, 201)
        importacao_id = apply_response.data["importacao_id"]

        limpar_response = self.client.delete(
            f"/api/importacao-nota-fiscal/{importacao_id}/limpar/"
        )

        self.assertEqual(limpar_response.status_code, 403)
        self.assertEqual(ImportacaoNotaFiscal.objects.count(), 1)

    def test_admin_pode_limpar_importacao_legada_sem_variacao_vinculada(self):
        importacao = ImportacaoNotaFiscal.objects.create(
            chave_acesso="21241103218475000147550010000002541762713531",
            numero="254",
            serie="1",
            fornecedor_nome="M. Gomes dos Santos - ME",
            fornecedor_documento="21241103218475",
            arquivo_nome="nfe_legada.xml",
        )
        ImportacaoNotaFiscalItem.objects.create(
            importacao=importacao,
            indice=1,
            codigo_produto="2448",
            descricao_produto="ARGAMASSA 20KG AC3",
            quantidade="1.0000",
            valor_unitario="35.0000",
            variacao=None,
            movimentacao=None,
        )

        self.client.force_authenticate(user=self.admin_user)
        limpar_response = self.client.delete(
            f"/api/importacao-nota-fiscal/{importacao.id}/limpar/"
        )

        self.assertEqual(limpar_response.status_code, 200)
        self.assertEqual(ImportacaoNotaFiscal.objects.count(), 0)
        self.assertEqual(limpar_response.data["itens_estornados"], 0)
        self.assertEqual(limpar_response.data["itens_sem_vinculo"], 1)


class ConfiguracaoSistemaTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create_user(username="admin", password="123456")
        self.admin_user.perfil.tipo = PerfilUsuario.Tipo.ADMIN
        self.admin_user.perfil.save(update_fields=["tipo"])
        self.funcionario = User.objects.create_user(
            username="funcionario",
            password="123456",
        )
        self.funcionario.perfil.tipo = PerfilUsuario.Tipo.FUNCIONARIO
        self.funcionario.perfil.save(update_fields=["tipo"])

    def test_get_publico_retorna_configuracao_padrao(self):
        response = self.client.get("/api/configuracao-sistema/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["nome_empresa"], "EstoquePro")
        self.assertEqual(response.data["cor_primaria"], "#1768AC")

    def test_admin_pode_atualizar_configuracao_com_logo(self):
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.patch(
            "/api/configuracao-sistema/",
            {
                "nome_empresa": "Minha Empresa",
                "descricao_empresa": "Estoque com identidade visual",
                "cor_primaria": "#223344",
                "cor_secundaria": "#112233",
                "cor_acento": "#EE8844",
                "logo": SimpleUploadedFile(
                    "logo.png",
                    b"arquivo-de-logo",
                    content_type="image/png",
                ),
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, 200)

        configuracao = ConfiguracaoSistema.objects.get(pk=1)
        self.assertEqual(configuracao.nome_empresa, "Minha Empresa")
        self.assertEqual(configuracao.cor_acento, "#EE8844")
        self.assertIn("logo", configuracao.logo.name)
        self.assertEqual(configuracao.atualizado_por, self.admin_user)

    def test_configuracao_publica_nao_expoe_campos_de_backup(self):
        response = self.client.get("/api/configuracao-sistema/")

        self.assertEqual(response.status_code, 200)
        self.assertNotIn("backup_horarios", response.data)
        self.assertNotIn("backup_ultimo_em", response.data)

    def test_rotas_de_backup_nao_estao_disponiveis(self):
        self.client.force_authenticate(user=self.admin_user)

        self.assertEqual(self.client.get("/api/backups/").status_code, 404)
        self.assertEqual(self.client.post("/api/backups/").status_code, 404)

    def test_funcionario_nao_pode_atualizar_configuracao(self):
        self.client.force_authenticate(user=self.funcionario)

        response = self.client.patch(
            "/api/configuracao-sistema/",
            {"nome_empresa": "Nao pode"},
            format="multipart",
        )

        self.assertEqual(response.status_code, 403)


class PedidoVendaTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username="vendedor", password="123456")
        self.client.force_authenticate(user=self.user)

        self.produto = Produto.objects.create(
            nome="Camisa Basica",
            categoria=Produto.Categoria.ROUPA,
            subcategoria=Produto.Subcategoria.CAMISA,
            marca="Marca Y",
            sku="CAM-010",
            preco_custo="25.00",
            preco_venda="49.90",
            estoque_minimo=1,
        )
        self.variacao = Variacao.objects.create(
            produto=self.produto,
            cor="Preto",
            tamanho=Variacao.Tamanho.M,
            saldo_atual=5,
        )

    def test_pedido_rascunho_nao_movimenta_estoque(self):
        response = self.client.post(
            "/api/pedidos/",
            {
                "cliente_nome": "Cliente Teste",
                "cliente_documento": "12345678901",
                "status": "rascunho",
                "observacao": "Separar produto",
                "itens": [
                    {
                        "variacao": self.variacao.id,
                        "quantidade": 2,
                        "preco_unitario": "49.90",
                    }
                ],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.variacao.refresh_from_db()
        self.assertEqual(self.variacao.saldo_atual, 5)
        self.assertEqual(Movimentacao.objects.count(), 0)

    def test_pedido_finalizado_sem_saldo_retorna_erro_json(self):
        response = self.client.post(
            "/api/pedidos/",
            {
                "cliente_nome": "Cliente Sem Estoque",
                "status": "finalizado",
                "itens": [
                    {
                        "variacao": self.variacao.id,
                        "quantidade": 8,
                        "preco_unitario": "49.90",
                    }
                ],
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("itens", response.data)
        self.assertIn("Estoque insuficiente", str(response.data["itens"]))
        self.variacao.refresh_from_db()
        self.assertEqual(self.variacao.saldo_atual, 5)
        self.assertEqual(Movimentacao.objects.count(), 0)

    def test_pedido_finalizado_baixa_estoque_e_cancelado_estorna(self):
        create_response = self.client.post(
            "/api/pedidos/",
            {
                "cliente_nome": "Cliente Final",
                "status": "rascunho",
                "itens": [
                    {
                        "variacao": self.variacao.id,
                        "quantidade": 2,
                        "preco_unitario": "49.90",
                    }
                ],
            },
            format="json",
        )

        self.assertEqual(create_response.status_code, 201)
        pedido_id = create_response.data["id"]

        finalize_response = self.client.put(
            f"/api/pedidos/{pedido_id}/",
            {
                "cliente_nome": "Cliente Final",
                "status": "finalizado",
                "itens": [
                    {
                        "variacao": self.variacao.id,
                        "quantidade": 2,
                        "preco_unitario": "49.90",
                    }
                ],
            },
            format="json",
        )

        self.assertEqual(finalize_response.status_code, 200)
        self.variacao.refresh_from_db()
        self.assertEqual(self.variacao.saldo_atual, 3)
        self.assertEqual(Movimentacao.objects.count(), 1)
        self.assertEqual(Movimentacao.objects.first().responsavel, self.user)

        cancel_response = self.client.put(
            f"/api/pedidos/{pedido_id}/",
            {
                "cliente_nome": "Cliente Final",
                "status": "cancelado",
                "itens": [
                    {
                        "variacao": self.variacao.id,
                        "quantidade": 2,
                        "preco_unitario": "49.90",
                    }
                ],
            },
            format="json",
        )

        self.assertEqual(cancel_response.status_code, 200)
        self.variacao.refresh_from_db()
        self.assertEqual(self.variacao.saldo_atual, 5)
        self.assertEqual(Movimentacao.objects.count(), 2)
        self.assertEqual(PedidoVenda.objects.get(pk=pedido_id).status, "cancelado")


class RelatoriosTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username="gestor", password="123456")
        self.client.force_authenticate(user=self.user)

        self.fornecedor = Fornecedor.objects.create(
            nome="Fornecedor Base",
            documento="12345678000199",
        )
        self.produto = Produto.objects.create(
            nome="Tenis Branco",
            categoria=Produto.Categoria.CALCADO,
            subcategoria=Produto.Subcategoria.TENIS,
            marca="Marca Z",
            sku="TEN-100",
            fornecedor=self.fornecedor,
            preco_custo="100.00",
            preco_venda="180.00",
            estoque_minimo=4,
        )
        self.variacao = Variacao.objects.create(
            produto=self.produto,
            cor="Branco",
            numeracao=Variacao.Numeracao.N42,
            saldo_atual=1,
        )

        entrada, _ = registrar_movimentacao(
            variacao=self.variacao,
            tipo=Movimentacao.Tipo.ENTRADA,
            quantidade=3,
            observacao="Entrada de teste",
        )
        saida, _ = registrar_movimentacao(
            variacao=self.variacao,
            tipo=Movimentacao.Tipo.SAIDA,
            quantidade=2,
            observacao="Saida de teste",
        )

        data_base = timezone.now() - timedelta(days=2)
        Movimentacao.objects.filter(pk=entrada.pk).update(data=data_base)
        Movimentacao.objects.filter(pk=saida.pk).update(data=data_base + timedelta(days=1))

        self.pedido = PedidoVenda.objects.create(
            cliente_nome="Cliente mensal",
            status=PedidoVenda.Status.FINALIZADO,
            criado_por=self.user,
        )
        PedidoVendaItem.objects.create(
            pedido=self.pedido,
            variacao=self.variacao,
            quantidade=2,
            preco_unitario="180.00",
        )
        PedidoVenda.objects.filter(pk=self.pedido.pk).update(
            atualizado_em=timezone.now() - timedelta(days=1)
        )

    def test_relatorio_mensal_retorna_resumo_do_periodo(self):
        hoje = timezone.localdate()
        response = self.client.get(
            f"/api/relatorios/mensal/?ano={hoje.year}&mes={hoje.month}"
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["resumo"]["entradas_unidades"], 3)
        self.assertEqual(response.data["resumo"]["saidas_unidades"], 2)
        self.assertEqual(response.data["resumo"]["pedidos_finalizados"], 1)
        self.assertEqual(len(response.data["top_saidas"]), 1)

    def test_relatorio_reposicao_retorna_itens_sugeridos(self):
        response = self.client.get("/api/relatorios/reposicao/?dias_base=30")

        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(response.data["resumo"]["total_itens"], 1)
        self.assertEqual(response.data["itens"][0]["sku"], "TEN-100")
        self.assertGreaterEqual(response.data["itens"][0]["sugestao_pedido"], 1)
