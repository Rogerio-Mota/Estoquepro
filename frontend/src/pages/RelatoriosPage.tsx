import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import EmptyState from "../components/EmptyState";
import Layout from "../components/Layout";
import PageHeader from "../components/PageHeader";
import SummaryCard from "../components/SummaryCard";
import useSystemConfig from "../hooks/useSystemConfig";
import { authJsonRequest } from "../services/api";
import {
  createReportExportModel,
  exportReportExcel,
  exportReportPdfFile,
  printReportSpreadsheet,
} from "../utils/reportExports";
import { formatCurrency } from "../utils/formatters";


function getCurrentMonthValue() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${month}`;
}


function parseMonthValue(value) {
  const [year, month] = String(value || "").split("-").map(Number);
  return {
    year: Number.isNaN(year) ? new Date().getFullYear() : year,
    month: Number.isNaN(month) ? new Date().getMonth() + 1 : month,
  };
}

function getStatusLabel(status) {
  if (status === "urgente") {
    return "Urgente";
  }

  if (status === "atencao") {
    return "Atenção";
  }

  return status || "-";
}


async function fetchRelatorios({ mesReferencia, diasBase }) {
  const { year, month } = parseMonthValue(mesReferencia);

  const [mensalData, reposicaoData] = await Promise.all([
    authJsonRequest(
      `/relatorios/mensal/?ano=${year}&mes=${month}`,
      {},
      "Erro ao carregar o relatório mensal.",
    ),
    authJsonRequest(
      `/relatorios/reposicao/?dias_base=${diasBase}`,
      {},
      "Erro ao carregar a sugestão de reposição.",
    ),
  ]);

  return {
    mensalData,
    reposicaoData,
  };
}


export default function RelatoriosPage() {
  const { config } = useSystemConfig();
  const [mesReferencia, setMesReferencia] = useState(getCurrentMonthValue());
  const [diasBase, setDiasBase] = useState("30");
  const [relatorioMensal, setRelatorioMensal] = useState(null);
  const [relatorioReposicao, setRelatorioReposicao] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [exportando, setExportando] = useState("");
  const [erro, setErro] = useState("");

  async function carregarRelatorios() {
    setErro("");
    setCarregando(true);

    try {
      const { mensalData, reposicaoData } = await fetchRelatorios({
        mesReferencia,
        diasBase,
      });

      setRelatorioMensal(mensalData);
      setRelatorioReposicao(reposicaoData);
    } catch (error) {
      setErro(error.message || "Erro ao carregar relatórios.");
      toast.error(error.message || "Erro ao carregar relatórios.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    async function carregarInicial() {
      setErro("");
      setCarregando(true);

      try {
        const { mensalData, reposicaoData } = await fetchRelatorios({
          mesReferencia: getCurrentMonthValue(),
          diasBase: "30",
        });

        setRelatorioMensal(mensalData);
        setRelatorioReposicao(reposicaoData);
      } catch (error) {
        setErro(error.message || "Erro ao carregar relatórios.");
        toast.error(error.message || "Erro ao carregar relatórios.");
      } finally {
        setCarregando(false);
      }
    }

    carregarInicial();
  }, []);

  const diasComMovimento = useMemo(() => {
    return (relatorioMensal?.movimentacoes_por_dia || []).filter(
      (dia) => dia.entradas || dia.saidas,
    );
  }, [relatorioMensal]);

  const modeloExportacao = useMemo(() => {
    if (!relatorioMensal || !relatorioReposicao) {
      return null;
    }

    return createReportExportModel({
      empresaNome: config?.nome_empresa,
      empresaLogoUrl: config?.logo_url,
      relatorioMensal,
      relatorioReposicao,
      diasBase,
    });
  }, [config?.logo_url, config?.nome_empresa, diasBase, relatorioMensal, relatorioReposicao]);

  async function handleExportPdf() {
    if (!modeloExportacao) {
      return;
    }

    setExportando("pdf");

    try {
      await exportReportPdfFile(modeloExportacao);
      toast.success("Relatório em PDF gerado com sucesso.");
    } catch (error) {
      toast.error(error.message || "Não foi possível exportar o relatório em PDF.");
    } finally {
      setExportando("");
    }
  }

  async function handleExportExcel() {
    if (!modeloExportacao) {
      return;
    }

    setExportando("excel");

    try {
      await exportReportExcel(modeloExportacao);
      toast.success("Relatório em Excel exportado com sucesso.");
    } catch (error) {
      toast.error(error.message || "Não foi possível exportar o relatório em Excel.");
    } finally {
      setExportando("");
    }
  }

  function handlePrintSpreadsheet() {
    if (!modeloExportacao) {
      return;
    }

    try {
      printReportSpreadsheet(modeloExportacao);
    } catch (error) {
      toast.error(error.message || "Não foi possível abrir a impressão do relatório.");
    }
  }

  return (
    <Layout title="Relatórios">
      <div className="form-shell form-shell--wide reports-page">
        <PageHeader
          title="Relatórios"
          action={(
            <div className="table-actions reports-page__actions">
              <button
                type="button"
                className="button-secondary reports-page__print-button"
                onClick={handlePrintSpreadsheet}
                disabled={!modeloExportacao || carregando || Boolean(exportando)}
              >
                Imprimir planilha
              </button>
              <button
                type="button"
                className="button-secondary"
                onClick={handleExportExcel}
                disabled={!modeloExportacao || carregando || Boolean(exportando)}
              >
                {exportando === "excel" ? "Gerando Excel..." : "Exportar Excel"}
              </button>
              <button
                type="button"
                className="button-primary"
                onClick={handleExportPdf}
                disabled={!modeloExportacao || carregando || Boolean(exportando)}
              >
                {exportando === "pdf" ? "Gerando PDF..." : "Exportar PDF"}
              </button>
            </div>
          )}
        />

        {erro ? <div className="alert-error">{erro}</div> : null}

        <div className="page-card section-card reports-page__filters" style={{ marginBottom: "20px" }}>
          <div className="filters-grid">
            <div>
              <label className="form-label">Mês</label>
              <input
                type="month"
                value={mesReferencia}
                onChange={(event) => setMesReferencia(event.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Base do pedido</label>
              <select
                value={diasBase}
                onChange={(event) => setDiasBase(event.target.value)}
              >
                <option value="15">15 dias</option>
                <option value="30">30 dias</option>
                <option value="60">60 dias</option>
                <option value="90">90 dias</option>
              </select>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="button-primary"
              onClick={carregarRelatorios}
              disabled={carregando}
            >
              {carregando ? "Atualizando..." : "Atualizar"}
            </button>
          </div>
        </div>

        {relatorioMensal ? (
          <div className="summary-grid">
            <SummaryCard
              title="Entradas"
              value={relatorioMensal.resumo.entradas_unidades}
              tone="blue"
              caption={relatorioMensal.referencia.label}
            />
            <SummaryCard
              title="Saídas"
              value={relatorioMensal.resumo.saidas_unidades}
              tone="orange"
              caption={`${relatorioMensal.resumo.movimentacoes} movimentos`}
            />
            <SummaryCard
              title="Pedidos"
              value={relatorioMensal.resumo.pedidos_finalizados}
              tone="green"
              caption="Finalizados no mês"
            />
            <SummaryCard
              title="Faturamento"
              value={formatCurrency(relatorioMensal.resumo.faturamento_estimado)}
              tone="blue"
              caption="Estimado"
            />
          </div>
        ) : null}

        <div className="dashboard-grid--wide">
          <div className="page-card table-card">
            <div className="section-header-inline">
              <div>
                <h3 className="section-title">Movimento do mês</h3>
                <p className="table-inline-note">
                  {relatorioMensal?.referencia?.label || "-"}
                </p>
              </div>
            </div>

            {diasComMovimento.length === 0 ? (
              <EmptyState>Sem movimentos no período.</EmptyState>
            ) : (
              <div className="table-wrapper">
                <table className="table-modern">
                  <thead>
                    <tr>
                      <th>Dia</th>
                      <th>Entradas</th>
                      <th>Saídas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {diasComMovimento.map((dia) => (
                      <tr key={dia.data}>
                        <td>{dia.label}</td>
                        <td>{dia.entradas}</td>
                        <td>{dia.saidas}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="page-card table-card">
            <h3 className="section-title">Mais saídas</h3>
            {relatorioMensal?.top_saidas?.length ? (
              <div className="table-wrapper">
                <table className="table-modern">
                  <thead>
                    <tr>
                      <th>Produto</th>
                      <th>SKU</th>
                      <th>Qtd</th>
                    </tr>
                  </thead>
                  <tbody>
                    {relatorioMensal.top_saidas.map((item) => (
                      <tr key={item.produto_id}>
                        <td>{item.nome}</td>
                        <td>{item.sku}</td>
                        <td>{item.quantidade}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState>Sem saídas no período.</EmptyState>
            )}
          </div>
        </div>

        <div className="page-card table-card">
          <div className="section-header-inline">
            <div>
              <h3 className="section-title">Pedido sugerido</h3>
                <p className="table-inline-note">Base dos últimos {diasBase} dias</p>
            </div>
            <strong>
              {formatCurrency(relatorioReposicao?.resumo?.valor_total_estimado || 0)}
            </strong>
          </div>

          {relatorioReposicao?.itens?.length ? (
            <div className="table-wrapper">
              <table className="table-modern">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Fornecedor</th>
                    <th>Atual</th>
                    <th>Mínimo</th>
                    <th>Saída</th>
                    <th>Pedir</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {relatorioReposicao.itens.map((item) => (
                    <tr key={item.produto_id}>
                      <td>
                        <strong>{item.nome}</strong>
                        <div className="table-inline-note">{item.sku}</div>
                      </td>
                      <td>{item.fornecedor_nome || "-"}</td>
                      <td>{item.estoque_atual}</td>
                      <td>{item.estoque_minimo}</td>
                      <td>{item.saida_recente}</td>
                      <td>{item.sugestao_pedido}</td>
                      <td>
                        <span
                          className={`badge ${
                            item.status === "urgente"
                              ? "badge-danger"
                              : "badge-warning"
                          }`}
                        >
                          {getStatusLabel(item.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState>Nenhum item precisa de reposição no momento.</EmptyState>
          )}
        </div>
      </div>
    </Layout>
  );
}
