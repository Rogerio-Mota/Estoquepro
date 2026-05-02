import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import EmptyState from "../components/EmptyState";
import Layout from "../components/Layout";
import PageHeader from "../components/PageHeader";
import SummaryCard from "../components/SummaryCard";
import { authJsonRequest, extractCollection } from "../services/api";
import { formatDate } from "../utils/formatters";

const PERIOD_OPTIONS = [
  { value: "dia", label: "Dia" },
  { value: "semana", label: "Semana" },
  { value: "mes", label: "Mês" },
];

function getTipoLabel(tipo) {
  return tipo === "entrada" ? "Entrada" : "Saída";
}

function getBadgeClass(tipo) {
  return tipo === "entrada" ? "badge-success" : "badge-danger";
}

function buildMovimentacaoMeta(movimentacao) {
  return [movimentacao.responsavel_username || "Sistema", movimentacao.fornecedor_nome]
    .filter(Boolean)
    .join(" | ");
}

export default function RelatoriosPage() {
  const [periodo, setPeriodo] = useState("mes");
  const [responsavelFiltro, setResponsavelFiltro] = useState("");
  const [relatorio, setRelatorio] = useState(null);
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  async function carregarRelatorios(periodoSelecionado = periodo) {
    setErro("");
    setCarregando(true);

    try {
      const [relatorioData, movimentacoesData] = await Promise.all([
        authJsonRequest(
          `/relatorios/vendas/?periodo=${periodoSelecionado}`,
          {},
          "Erro ao carregar o relatório de vendas.",
        ),
        authJsonRequest(
          `/movimentacoes/?periodo=${periodoSelecionado}`,
          {},
          "Erro ao carregar as movimentações do período.",
        ),
      ]);

      setRelatorio(relatorioData);
      setMovimentacoes(extractCollection(movimentacoesData));
    } catch (error) {
      setErro(error.message || "Erro ao carregar relatórios.");
      toast.error(error.message || "Erro ao carregar relatórios.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarRelatorios("mes");
  }, []);

  const responsaveis = useMemo(() => {
    return [...new Set(
      movimentacoes
        .map((movimentacao) => movimentacao.responsavel_username)
        .filter(Boolean),
    )].sort((first, second) => first.localeCompare(second, "pt-BR"));
  }, [movimentacoes]);

  const movimentacoesFiltradas = useMemo(() => {
    if (!responsavelFiltro) {
      return movimentacoes;
    }

    return movimentacoes.filter(
      (movimentacao) => movimentacao.responsavel_username === responsavelFiltro,
    );
  }, [movimentacoes, responsavelFiltro]);

  return (
    <Layout title="Relatórios">
      <div className="form-shell form-shell--wide reports-page">
        <PageHeader title="Relatórios" />

        {erro ? <div className="alert-error">{erro}</div> : null}

        <div className="page-card section-card" style={{ marginBottom: "20px" }}>
          <div className="filters-grid">
            <div>
              <label className="form-label">Período</label>
              <select
                value={periodo}
                onChange={(event) => setPeriodo(event.target.value)}
              >
                {PERIOD_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Responsável</label>
              <select
                value={responsavelFiltro}
                onChange={(event) => setResponsavelFiltro(event.target.value)}
              >
                <option value="">Todos</option>
                {responsaveis.map((responsavel) => (
                  <option key={responsavel} value={responsavel}>
                    {responsavel}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="button-primary"
              onClick={() => carregarRelatorios(periodo)}
              disabled={carregando}
            >
              {carregando ? "Carregando..." : "Atualizar"}
            </button>
          </div>
        </div>

        {relatorio ? (
          <div className="summary-grid">
            <SummaryCard
              title="Vendas"
              value={relatorio.resumo.vendas_registradas}
              tone="blue"
              caption={relatorio.periodo.label}
            />
            <SummaryCard
              title="Itens"
              value={relatorio.resumo.itens_vendidos}
              tone="green"
              caption="Vendidos"
            />
          </div>
        ) : null}

        <div className="dashboard-grid--wide">
          <div className="page-card table-card">
            <div className="section-header-inline">
              <h3 className="section-title">Mais vendidos</h3>
            </div>

            {relatorio?.itens?.length ? (
              <div className="table-wrapper">
                <table className="table-modern">
                  <thead>
                    <tr>
                      <th>Produto</th>
                      <th>Qtd</th>
                    </tr>
                  </thead>
                  <tbody>
                    {relatorio.itens.map((item) => (
                      <tr key={item.produto_id}>
                        <td>
                          <div className="table-cell-primary">{item.nome}</div>
                          <div className="table-cell-meta">{item.sku}</div>
                        </td>
                        <td>{item.quantidade}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState>Nenhuma venda no período.</EmptyState>
            )}
          </div>

          <div className="page-card table-card">
            <div className="section-header-inline">
              <h3 className="section-title">Movimentações</h3>
            </div>

            {movimentacoesFiltradas.length ? (
              <div className="table-wrapper">
                <table className="table-modern">
                  <thead>
                    <tr>
                      <th>Produto</th>
                      <th>Tipo</th>
                      <th>Qtd</th>
                      <th>Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movimentacoesFiltradas.map((movimentacao) => (
                      <tr key={movimentacao.id}>
                        <td>
                          <div className="table-cell-primary">
                            {movimentacao.produto_nome}
                          </div>
                          <div className="table-cell-meta">
                            {buildMovimentacaoMeta(movimentacao)}
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${getBadgeClass(movimentacao.tipo)}`}>
                            {getTipoLabel(movimentacao.tipo)}
                          </span>
                        </td>
                        <td>{movimentacao.quantidade}</td>
                        <td>{formatDate(movimentacao.data_referencia || movimentacao.data)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState>Nenhuma movimentação encontrada.</EmptyState>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
