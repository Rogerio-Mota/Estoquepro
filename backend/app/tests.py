from datetime import timedelta

from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from .models import Fornecedor, Movimentacao, PedidoVenda, PedidoVendaItem, PerfilUsuario, Produto, Variacao
from .services import registrar_movimentacao


def criar_admin(username="admin", password="123456"):
    user = User.objects.create_user(username=username, password=password)
    user.perfil.tipo = PerfilUsuario.Tipo.ADMIN
    user.perfil.save(update_fields=["tipo"])
    return user


class RegistroMovimentacaoTests(TestCase):
    def setUp(self):
        self.fornecedor = Fornecedor.objects.create(
            nome="Fornecedor Norte",
            contato="(99) 99999-9999",
            cidade="Balsas",
        )
        self.produto = Produto.objects.create(
            nome="Camisa Polo",
            categoria=Produto.Categoria.ROUPA,
            subcategoria=Produto.Subcategoria.CAMISA,
            marca="Marca X",
            sku="CAM-001",
            preco_custo="40.00",
            preco_venda="79.90",
            estoque_minimo=2,
            fornecedor=self.fornecedor,
        )
        self.variacao = Variacao.objects.create(
            produto=self.produto,
            cor="Azul",
            tamanho=Variacao.Tamanho.M,
            saldo_atual=5,
        )

    def test_registrar_entrada_atualiza_saldo_e_guarda_fornecedor_e_data(self):
        movimentacao, variacao = registrar_movimentacao(
            variacao=self.variacao,
            tipo=Movimentacao.Tipo.ENTRADA,
            quantidade=3,
            observacao="Reposicao",
            fornecedor=self.fornecedor,
            data_referencia=timezone.localdate(),
        )

        self.assertEqual(movimentacao.tipo, Movimentacao.Tipo.ENTRADA)
        self.assertEqual(movimentacao.fornecedor, self.fornecedor)
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
            fornecedor=self.fornecedor,
            data_referencia=timezone.localdate(),
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
        self.assertEqual(User.objects.get(username="admininicial").perfil.tipo, PerfilUsuario.Tipo.ADMIN)

    def test_primeiro_acesso_bloqueia_segunda_criacao(self):
        criar_admin("root")

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


class UsuarioAdminUnicoTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = criar_admin()
        self.client.force_authenticate(user=self.admin)

    def test_admin_nao_pode_criar_segundo_administrador(self):
        response = self.client.post(
            "/api/usuarios/",
            {
                "username": "admin2",
                "password": "123456",
                "tipo": "admin",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("tipo", response.data)

    def test_admin_pode_criar_funcionario(self):
        response = self.client.post(
            "/api/usuarios/",
            {
                "username": "funcionario1",
                "password": "123456",
                "tipo": "funcionario",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(User.objects.get(username="funcionario1").perfil.tipo, PerfilUsuario.Tipo.FUNCIONARIO)

    def test_sistema_mantem_um_administrador_principal(self):
        response = self.client.put(
            f"/api/usuarios/{self.admin.id}/",
            {
                "username": self.admin.username,
                "tipo": "funcionario",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("tipo", response.data)

    def test_nao_permite_excluir_o_unico_admin(self):
        response = self.client.delete(f"/api/usuarios/{self.admin.id}/")

        self.assertEqual(response.status_code, 400)
        self.assertIn("detail", response.data)


class VariacaoAutomaticaTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin_user = criar_admin("adminestoque")
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
        self.assertEqual(Movimentacao.objects.get(variacao=variacao).quantidade, 4)

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


class FornecedorTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin_user = criar_admin("adminfornecedor")
        self.client.force_authenticate(user=self.admin_user)

    def test_fornecedor_retorna_produtos_fornecidos(self):
        fornecedor = Fornecedor.objects.create(
            nome="Fornecedor Centro",
            contato="Joao",
            cidade="Balsas",
        )
        Produto.objects.create(
            nome="Cinto Social",
            categoria=Produto.Categoria.ACESSORIO,
            subcategoria=Produto.Subcategoria.CINTO,
            marca="Marca A",
            sku="CIN-001",
            preco_custo="20.00",
            preco_venda="49.90",
            fornecedor=fornecedor,
        )

        response = self.client.get("/api/fornecedores/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data[0]["cidade"], "Balsas")
        self.assertEqual(response.data[0]["produtos_fornecidos"], ["Cinto Social"])


class ProdutoDuplicadoTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin_user = criar_admin("adminproduto")
        self.client.force_authenticate(user=self.admin_user)

        self.fornecedor = Fornecedor.objects.create(
            nome="Fornecedor Teste",
            contato="Maria",
            cidade="Balsas",
        )
        self.payload_base = {
            "nome": "Camisa Basica",
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
                "nome": "Camisa Nova",
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
                "nome": "  camisa basica  ",
                "marca": "marca y",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("nome", response.data)


class VendaTests(TestCase):
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

    def test_venda_sem_saldo_retorna_erro_json(self):
        response = self.client.post(
            "/api/pedidos/",
            {
                "cliente_nome": "Cliente Sem Estoque",
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
        self.variacao.refresh_from_db()
        self.assertEqual(self.variacao.saldo_atual, 5)

    def test_venda_registrada_baixa_estoque(self):
        response = self.client.post(
            "/api/pedidos/",
            {
                "cliente_nome": "Cliente Final",
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
        self.assertEqual(self.variacao.saldo_atual, 3)
        self.assertEqual(PedidoVenda.objects.count(), 1)
        self.assertEqual(PedidoVenda.objects.first().status, PedidoVenda.Status.FINALIZADO)

    def test_venda_nao_pode_ser_editada_pela_api(self):
        response = self.client.post(
            "/api/pedidos/",
            {
                "cliente_nome": "Cliente Final",
                "itens": [
                    {
                        "variacao": self.variacao.id,
                        "quantidade": 1,
                        "preco_unitario": "49.90",
                    }
                ],
            },
            format="json",
        )

        venda_id = response.data["id"]
        update_response = self.client.put(
            f"/api/pedidos/{venda_id}/",
            {
                "cliente_nome": "Outro cliente",
                "itens": [],
            },
            format="json",
        )

        self.assertEqual(update_response.status_code, 405)


class RelatoriosTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username="gestor", password="123456")
        self.client.force_authenticate(user=self.user)

        self.fornecedor = Fornecedor.objects.create(
            nome="Fornecedor Base",
            contato="Carlos",
            cidade="Balsas",
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
            saldo_atual=5,
        )

        entrada, _ = registrar_movimentacao(
            variacao=self.variacao,
            tipo=Movimentacao.Tipo.ENTRADA,
            quantidade=3,
            observacao="Entrada de teste",
            usuario=self.user,
            fornecedor=self.fornecedor,
            data_referencia=timezone.localdate() - timedelta(days=1),
        )
        saida, _ = registrar_movimentacao(
            variacao=self.variacao,
            tipo=Movimentacao.Tipo.SAIDA,
            quantidade=2,
            observacao="Saida de teste",
            usuario=self.user,
            data_referencia=timezone.localdate() - timedelta(days=1),
        )

        data_base = timezone.now() - timedelta(days=1)
        Movimentacao.objects.filter(pk=entrada.pk).update(data=data_base)
        Movimentacao.objects.filter(pk=saida.pk).update(data=data_base)

        self.venda = PedidoVenda.objects.create(
            cliente_nome="Cliente mensal",
            status=PedidoVenda.Status.FINALIZADO,
            criado_por=self.user,
        )
        PedidoVendaItem.objects.create(
            pedido=self.venda,
            variacao=self.variacao,
            quantidade=2,
            preco_unitario="180.00",
        )
        PedidoVenda.objects.filter(pk=self.venda.pk).update(
            atualizado_em=timezone.now() - timedelta(days=1)
        )

    def test_relatorio_vendas_retorna_produtos_mais_vendidos(self):
        response = self.client.get("/api/relatorios/vendas/?periodo=mes")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["resumo"]["vendas_registradas"], 1)
        self.assertEqual(response.data["resumo"]["itens_vendidos"], 2)
        self.assertEqual(response.data["itens"][0]["sku"], "TEN-100")

    def test_movimentacoes_podem_ser_filtradas_por_periodo(self):
        response = self.client.get("/api/movimentacoes/?periodo=mes")

        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.data), 2)
