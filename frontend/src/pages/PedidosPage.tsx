import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import SummaryCard from "@/components/dashboard/SummaryCard";
import EmptyState from "@/components/feedback/EmptyState";
import Layout from "@/components/layout/Layout";
import PageHeader from "@/components/layout/PageHeader";
import PaginationControls from "@/components/navigation/PaginationControls";
import { authJsonRequest, extractCollection } from "@/services/api";
import { formatCurrency, formatDateTime } from "@/utils/formatters";

const ITENS_POR_PAGINA = 6;

export default function PedidosPage() {
  const navigate = useNavigate();
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [vendas, setVendas] = useState([]);
  const [busca, setBusca] = useState("");
  const [paginaAtual, setPaginaAtual] = useState(1);

  useEffect(() => {
    async function carregarVendas() {
      try {
        const data = await authJsonRequest("/pedidos/", {}, "Erro ao carregar vendas.");
        setVendas(extractCollection(data));
      } catch (error) {
        const message = error.message || "Erro ao carregar vendas.";
        setErro(message);
        toast.error(message);
      } finally {
        setCarregando(false);
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

  const faturamentoTotal = useMemo(() => {
    return vendasFiltradas.reduce(
      (accumulator, venda) => accumulator + Number(venda.valor_total || 0),
      0,
    );
  }, [vendasFiltradas]);

  const ticketMedio = vendasFiltradas.length
    ? faturamentoTotal / vendasFiltradas.length
    : 0;

  const itensVendidos = useMemo(() => {
    return vendasFiltradas.reduce((accumulator, venda) => {
      const quantidadeItens = Array.isArray(venda.itens)
        ? venda.itens.reduce(
            (subtotal, item) => subtotal + Number(item.quantidade || 0),
            0,
          )
        : 0;

      return accumulator + quantidadeItens;
    }, 0);
  }, [vendasFiltradas]);

  const ultimaVenda = useMemo(() => {
    return vendasFiltradas.reduce((maisRecente, venda) => {
      if (!maisRecente) {
        return venda;
      }

      return new Date(venda.criado_em).getTime() > new Date(maisRecente.criado_em).getTime()
        ? venda
        : maisRecente;
    }, null);
  }, [vendasFiltradas]);

  const clientesAtendidos = useMemo(() => {
    return new Set(
      vendasFiltradas.map((venda) => venda.cliente_nome).filter(Boolean),
    ).size;
  }, [vendasFiltradas]);

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
      <div className="sales-page">
        <PageHeader
          title="Vendas"
          description="Acompanhe o histórico comercial, consulte clientes atendidos e monitore o faturamento registrado no sistema."
          action={(
            <button
              type="button"
              className="button-primary"
              onClick={() => navigate("/novo-pedido")}
            >
              Nova venda
            </button>
          )}
        />

        <div className="summary-grid sales-page__summary">
          <SummaryCard
            title="Vendas encontradas"
            value={vendasFiltradas.length}
            tone="blue"
            caption={busca ? "Resultado filtrado pela busca." : "Base completa de vendas."}
          />
          <SummaryCard
            title="Faturamento"
            value={formatCurrency(faturamentoTotal)}
            tone="green"
            caption="Somatório das vendas exibidas."
          />
          <SummaryCard
            title="Ticket médio"
            value={formatCurrency(ticketMedio)}
            tone="orange"
            caption={`${itensVendidos} unidades vendidas`}
          />
        </div>

        {erro ? <div className="alert-error">{erro}</div> : null}

        <section className="page-card section-card sales-toolbar">
          <div className="sales-toolbar__header">
            <div>
              <span className="sales-eyebrow">Consulta comercial</span>
              <h3 className="section-title">Histórico de vendas</h3>
              <p className="section-subtitle">
                Busque por código da venda ou nome do cliente para encontrar registros com mais rapidez.
              </p>
            </div>

            {busca ? (
              <button
                type="button"
                className="button-secondary"
                onClick={() => atualizarBusca("")}
              >
                Limpar busca
              </button>
            ) : null}
          </div>

          <div className="sales-toolbar__grid">
            <div className="sales-toolbar__search">
              <label className="form-label">Buscar venda</label>
              <input
                type="text"
                placeholder="Ex.: VEN-00012 ou nome do cliente"
                value={busca}
                onChange={(event) => atualizarBusca(event.target.value)}
              />
            </div>

            <div className="sales-inline-metric">
              <span className="sales-inline-metric__label">Última venda</span>
              <strong className="sales-inline-metric__value">
                {ultimaVenda ? formatDateTime(ultimaVenda.criado_em) : "-"}
              </strong>
            </div>

            <div className="sales-inline-metric">
              <span className="sales-inline-metric__label">Clientes atendidos</span>
              <strong className="sales-inline-metric__value">{clientesAtendidos}</strong>
            </div>
          </div>
        </section>

        <section className="page-card table-card sales-table-card">
          {carregando ? (
            <EmptyState>Carregando vendas...</EmptyState>
          ) : (
            <>
              <div className="table-wrapper">
                <table className="table-modern">
                  <thead>
                    <tr>
                      <th>Venda</th>
                      <th>Cliente</th>
                      <th>Status</th>
                      <th>Total</th>
                      <th>Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendasPaginadas.length === 0 ? (
                      <tr>
                        <td colSpan={5}>
                          <EmptyState>Nenhuma venda encontrada.</EmptyState>
                        </td>
                      </tr>
                    ) : (
                      vendasPaginadas.map((venda) => {
                        const quantidadeItens = Array.isArray(venda.itens)
                          ? venda.itens.reduce(
                              (accumulator, item) => accumulator + Number(item.quantidade || 0),
                              0,
                            )
                          : 0;

                        return (
                          <tr key={venda.id}>
                            <td>
                              <div className="table-cell-primary">{venda.codigo}</div>
                              <div className="table-cell-meta">
                                {quantidadeItens} {quantidadeItens === 1 ? "unidade" : "unidades"}
                              </div>
                            </td>
                            <td>
                              <div className="table-cell-primary">{venda.cliente_nome}</div>
                              <div className="table-cell-meta">Pedido finalizado no caixa.</div>
                            </td>
                            <td>
                              <span className="badge badge-success">Finalizada</span>
                            </td>
                            <td>
                              <div className="table-cell-primary">
                                {formatCurrency(venda.valor_total)}
                              </div>
                            </td>
                            <td>{formatDateTime(venda.criado_em)}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <PaginationControls
                page={paginaSegura}
                totalPages={totalPaginas}
                onChange={irParaPagina}
              />
            </>
          )}
        </section>
      </div>
    </Layout>
  );
}
