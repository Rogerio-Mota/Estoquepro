import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import EmptyState from "../components/EmptyState";
import Layout from "../components/Layout";
import PageHeader from "../components/PageHeader";
import PaginationControls from "../components/PaginationControls";
import { getCategoryLabel } from "../constants/productOptions";
import useAuth from "../hooks/useAuth";
import { authJsonRequest, extractCollection } from "../services/api";
import { formatCurrency } from "../utils/formatters";

const ITENS_POR_PAGINA = 5;


export default function ProdutosPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [produtos, setProdutos] = useState([]);
  const [busca, setBusca] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("");
  const [paginaAtual, setPaginaAtual] = useState(1);

  useEffect(() => {
    async function carregarProdutos() {
      try {
        const data = await authJsonRequest("/produtos/", {}, "Erro ao carregar produtos.");
        setProdutos(extractCollection(data));
      } catch (error) {
        toast.error(error.message);
      }
    }

    carregarProdutos();
  }, []);

  const categorias = useMemo(
    () => [...new Set(produtos.map((produto) => produto.categoria).filter(Boolean))],
    [produtos],
  );

  const produtosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return produtos.filter((produto) => {
      const combinaBusca =
        produto.nome?.toLowerCase().includes(termo) ||
        produto.marca?.toLowerCase().includes(termo) ||
        produto.sku?.toLowerCase().includes(termo);
      const combinaCategoria =
        !categoriaFiltro || produto.categoria === categoriaFiltro;
      const combinaStatus = !statusFiltro || produto.status_estoque === statusFiltro;

      return combinaBusca && combinaCategoria && combinaStatus;
    });
  }, [produtos, busca, categoriaFiltro, statusFiltro]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(produtosFiltrados.length / ITENS_POR_PAGINA),
  );
  const paginaSegura = Math.min(paginaAtual, totalPaginas);
  const produtosPaginados = useMemo(() => {
    const inicio = (paginaSegura - 1) * ITENS_POR_PAGINA;
    return produtosFiltrados.slice(inicio, inicio + ITENS_POR_PAGINA);
  }, [paginaSegura, produtosFiltrados]);

  function atualizarBusca(value) {
    setBusca(value);
    setPaginaAtual(1);
  }

  function atualizarCategoria(value) {
    setCategoriaFiltro(value);
    setPaginaAtual(1);
  }

  function atualizarStatus(value) {
    setStatusFiltro(value);
    setPaginaAtual(1);
  }

  async function excluirProduto(id) {
    if (!window.confirm("Deseja excluir este produto?")) {
      return;
    }

    try {
      await authJsonRequest(`/produtos/${id}/`, { method: "DELETE" }, "Erro ao excluir produto.");
      setProdutos((prevState) => prevState.filter((produto) => produto.id !== id));
      toast.success("Produto excluído com sucesso.");
    } catch (error) {
      toast.error(error.message);
    }
  }

  function irParaPagina(numero) {
    if (numero < 1 || numero > totalPaginas) {
      return;
    }

    setPaginaAtual(numero);
  }

  return (
    <Layout title="Produtos">
      <PageHeader
        title="Catálogo de produtos"
        description="Busque, filtre e acompanhe o status de estoque dos itens cadastrados."
        action={
          user?.tipo === "admin" ? (
            <button
              type="button"
              className="button-primary"
              onClick={() => navigate("/novo-produto")}
            >
              Novo Produto
            </button>
          ) : null
        }
      />

      <div className="page-card section-card">
        <div className="filters-grid">
          <input
            type="text"
            placeholder="Buscar por nome, marca ou SKU"
            value={busca}
            onChange={(event) => atualizarBusca(event.target.value)}
          />

          <select
            value={categoriaFiltro}
            onChange={(event) => atualizarCategoria(event.target.value)}
          >
            <option value="">Todas as categorias</option>
            {categorias.map((categoria) => (
              <option key={categoria} value={categoria}>
                {getCategoryLabel(categoria)}
              </option>
            ))}
          </select>

          <select
            value={statusFiltro}
            onChange={(event) => atualizarStatus(event.target.value)}
          >
            <option value="">Todos os status</option>
            <option value="ok">OK</option>
            <option value="baixo">Baixo</option>
          </select>
        </div>
      </div>

      <div className="page-card table-card">
        <div className="table-wrapper">
          <table className="table-modern">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Marca</th>
                <th>Categoria</th>
                <th>Preço</th>
                <th>Estoque</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {produtosPaginados.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState>Nenhum produto encontrado.</EmptyState>
                  </td>
                </tr>
              ) : (
                produtosPaginados.map((produto) => (
                  <tr key={produto.id}>
                    <td>{produto.nome}</td>
                    <td>{produto.marca}</td>
                    <td>{getCategoryLabel(produto.categoria)}</td>
                    <td>{formatCurrency(produto.preco_venda)}</td>
                    <td>{produto.estoque_total}</td>
                    <td>
                      <span
                        className={`badge ${
                          produto.status_estoque === "baixo"
                            ? "badge-warning"
                            : "badge-success"
                        }`}
                      >
                        {produto.status_estoque}
                      </span>
                    </td>
                    <td>
                      {user?.tipo === "admin" ? (
                        <div className="table-actions">
                          <button
                            type="button"
                            className="button-secondary"
                            onClick={() => navigate(`/editar-produto/${produto.id}`)}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className="button-danger"
                            onClick={() => excluirProduto(produto.id)}
                          >
                            Excluir
                          </button>
                        </div>
                      ) : (
                        <span className="table-inline-note">Somente visualização</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <PaginationControls
          page={paginaSegura}
          totalPages={totalPaginas}
          onChange={irParaPagina}
        />
      </div>
    </Layout>
  );
}
