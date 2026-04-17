import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import EmptyState from "../components/EmptyState";
import Layout from "../components/Layout";
import PageHeader from "../components/PageHeader";
import PaginationControls from "../components/PaginationControls";
import { getCategoryLabel } from "../constants/productOptions";
import { authJsonRequest, extractCollection } from "../services/api";

const ITENS_POR_PAGINA = 6;


export default function EstoqueBaixoPage() {
  const [produtos, setProdutos] = useState([]);
  const [busca, setBusca] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState("");
  const [paginaAtual, setPaginaAtual] = useState(1);

  useEffect(() => {
    async function carregarProdutos() {
      try {
        const data = await authJsonRequest(
          "/produtos/estoque-baixo/",
          {},
          "Erro ao carregar produtos com estoque baixo.",
        );
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

      return combinaBusca && combinaCategoria;
    });
  }, [produtos, busca, categoriaFiltro]);

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

  function irParaPagina(numero) {
    if (numero < 1 || numero > totalPaginas) {
      return;
    }

    setPaginaAtual(numero);
  }

  return (
    <Layout title="Estoque Baixo">
      <PageHeader
        title="Produtos em atenção"
        description="Acompanhe rapidamente os itens que estão no limite mínimo ou abaixo dele."
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
        </div>
      </div>

      <div className="page-card table-card">
        {produtosPaginados.length === 0 ? (
          <EmptyState>Nenhum produto com estoque baixo no momento.</EmptyState>
        ) : (
          <div className="table-wrapper">
            <table className="table-modern">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Marca</th>
                  <th>SKU</th>
                  <th>Categoria</th>
                  <th>Mínimo</th>
                  <th>Atual</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {produtosPaginados.map((produto) => (
                  <tr key={produto.id}>
                    <td>{produto.nome}</td>
                    <td>{produto.marca}</td>
                    <td>{produto.sku}</td>
                    <td>{getCategoryLabel(produto.categoria)}</td>
                    <td>{produto.estoque_minimo}</td>
                    <td>{produto.estoque_total}</td>
                    <td>
                      <span className="badge badge-warning">baixo</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <PaginationControls
          page={paginaSegura}
          totalPages={totalPaginas}
          onChange={irParaPagina}
        />
      </div>
    </Layout>
  );
}
