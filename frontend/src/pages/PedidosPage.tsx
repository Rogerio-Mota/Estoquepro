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


function getStatusBadge(status) {
  if (status === "finalizado") {
    return "badge-success";
  }

  if (status === "cancelado") {
    return "badge-danger";
  }

  return "badge-warning";
}


export default function PedidosPage() {
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState([]);
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("");
  const [paginaAtual, setPaginaAtual] = useState(1);

  useEffect(() => {
    async function carregarPedidos() {
      try {
        const data = await authJsonRequest("/pedidos/", {}, "Erro ao carregar pedidos.");
        setPedidos(extractCollection(data));
      } catch (error) {
        toast.error(error.message);
      }
    }

    carregarPedidos();
  }, []);

  const pedidosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return pedidos.filter((pedido) => {
      const combinaBusca =
        pedido.codigo?.toLowerCase().includes(termo) ||
        pedido.cliente_nome?.toLowerCase().includes(termo) ||
        pedido.cliente_documento?.toLowerCase().includes(termo);
      const combinaStatus = !statusFiltro || pedido.status === statusFiltro;

      return combinaBusca && combinaStatus;
    });
  }, [pedidos, busca, statusFiltro]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(pedidosFiltrados.length / ITENS_POR_PAGINA),
  );
  const paginaSegura = Math.min(paginaAtual, totalPaginas);
  const pedidosPaginados = useMemo(() => {
    const inicio = (paginaSegura - 1) * ITENS_POR_PAGINA;
    return pedidosFiltrados.slice(inicio, inicio + ITENS_POR_PAGINA);
  }, [paginaSegura, pedidosFiltrados]);

  function atualizarBusca(value) {
    setBusca(value);
    setPaginaAtual(1);
  }

  function atualizarStatus(value) {
    setStatusFiltro(value);
    setPaginaAtual(1);
  }

  function irParaPagina(numero) {
    if (numero < 1 || numero > totalPaginas) {
      return;
    }

    setPaginaAtual(numero);
  }

  async function excluirPedido(id) {
    if (!window.confirm("Deseja excluir este pedido em rascunho?")) {
      return;
    }

    try {
      await authJsonRequest(`/pedidos/${id}/`, { method: "DELETE" }, "Erro ao excluir pedido.");
      setPedidos((prevState) => prevState.filter((pedido) => pedido.id !== id));
      toast.success("Pedido excluído com sucesso.");
    } catch (error) {
      toast.error(error.message);
    }
  }

  return (
    <Layout title="Pedidos">
      <PageHeader
        title="Pedidos e vendas"
        description="Organize o fluxo comercial e baixe o estoque automaticamente ao finalizar cada pedido."
        action={
          <button
            type="button"
            className="button-primary"
            onClick={() => navigate("/novo-pedido")}
          >
            Novo Pedido
          </button>
        }
      />

      <div className="page-card section-card">
        <div className="filters-grid">
          <input
            type="text"
            placeholder="Buscar por código, cliente ou documento"
            value={busca}
            onChange={(event) => atualizarBusca(event.target.value)}
          />

          <select
            value={statusFiltro}
            onChange={(event) => atualizarStatus(event.target.value)}
          >
            <option value="">Todos os status</option>
            <option value="rascunho">Rascunho</option>
            <option value="finalizado">Finalizado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
      </div>

      <div className="page-card table-card">
        <div className="table-wrapper">
          <table className="table-modern">
            <thead>
              <tr>
                <th>Código</th>
                <th>Cliente</th>
                <th>Status</th>
                <th>Itens</th>
                <th>Total</th>
                <th>Criado em</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {pedidosPaginados.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState>Nenhum pedido encontrado.</EmptyState>
                  </td>
                </tr>
              ) : (
                pedidosPaginados.map((pedido) => (
                  <tr key={pedido.id}>
                    <td>{pedido.codigo}</td>
                    <td>
                      <strong>{pedido.cliente_nome}</strong>
                      <div className="table-inline-note">
                        {pedido.cliente_documento || "Sem documento"}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadge(pedido.status)}`}>
                        {pedido.status}
                      </span>
                    </td>
                    <td>{pedido.itens.length}</td>
                    <td>{formatCurrency(pedido.valor_total)}</td>
                    <td>{formatDateTime(pedido.criado_em)}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="button-secondary"
                          onClick={() => navigate(`/editar-pedido/${pedido.id}`)}
                        >
                          Abrir
                        </button>
                        {pedido.status === "rascunho" ? (
                          <button
                            type="button"
                            className="button-danger"
                            onClick={() => excluirPedido(pedido.id)}
                          >
                            Excluir
                          </button>
                        ) : null}
                      </div>
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
