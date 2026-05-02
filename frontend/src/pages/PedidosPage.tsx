import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import EmptyState from "../components/EmptyState";
import Layout from "../components/Layout";
import PageHeader from "../components/PageHeader";
import PaginationControls from "../components/PaginationControls";
import { authJsonRequest, extractCollection } from "../services/api";
import { formatCurrency, formatDateTime } from "../utils/formatters";

const ITENS_POR_PAGINA = 6;

export default function PedidosPage() {
  const navigate = useNavigate();
  const [vendas, setVendas] = useState([]);
  const [busca, setBusca] = useState("");
  const [paginaAtual, setPaginaAtual] = useState(1);

  useEffect(() => {
    async function carregarVendas() {
      try {
        const data = await authJsonRequest("/pedidos/", {}, "Erro ao carregar vendas.");
        setVendas(extractCollection(data));
      } catch (error) {
        toast.error(error.message);
      }
    }

    carregarVendas();
  }, []);

  const vendasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return vendas.filter((venda) => (
      venda.codigo?.toLowerCase().includes(termo) ||
      venda.cliente_nome?.toLowerCase().includes(termo)
    ));
  }, [vendas, busca]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(vendasFiltradas.length / ITENS_POR_PAGINA),
  );
  const paginaSegura = Math.min(paginaAtual, totalPaginas);
  const vendasPaginadas = useMemo(() => {
    const inicio = (paginaSegura - 1) * ITENS_POR_PAGINA;
    return vendasFiltradas.slice(inicio, inicio + ITENS_POR_PAGINA);
  }, [paginaSegura, vendasFiltradas]);

  function atualizarBusca(value) {
    setBusca(value);
    setPaginaAtual(1);
  }

  function irParaPagina(numero) {
    if (numero < 1 || numero > totalPaginas) {
      return;
    }

    setPaginaAtual(numero);
  }

  return (
    <Layout title="Vendas">
      <PageHeader
        title="Vendas"
        action={
          <button
            type="button"
            className="button-primary"
            onClick={() => navigate("/novo-pedido")}
          >
            Nova venda
          </button>
        }
      />

      <div className="page-card section-card">
        <input
          type="text"
          placeholder="Buscar venda"
          value={busca}
          onChange={(event) => atualizarBusca(event.target.value)}
        />
      </div>

      <div className="page-card table-card">
        <div className="table-wrapper">
          <table className="table-modern">
            <thead>
              <tr>
                <th>Código</th>
                <th>Cliente</th>
                <th>Total</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {vendasPaginadas.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <EmptyState>Nenhuma venda encontrada.</EmptyState>
                  </td>
                </tr>
              ) : (
                vendasPaginadas.map((venda) => (
                  <tr key={venda.id}>
                    <td>{venda.codigo}</td>
                    <td>{venda.cliente_nome}</td>
                    <td>{formatCurrency(venda.valor_total)}</td>
                    <td>{formatDateTime(venda.criado_em)}</td>
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
