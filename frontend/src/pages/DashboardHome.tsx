import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import Layout from "../components/Layout";
import SummaryCard from "../components/SummaryCard";
import useAuth from "../hooks/useAuth";
import { authJsonRequest, extractCollection } from "../services/api";
import { formatCurrency } from "../utils/formatters";

const dayLabelFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
});


function buildDayKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}


function getBarHeight(value, maxValue) {
  if (!value || !maxValue) {
    return "0%";
  }

  return `${Math.max(8, (value / maxValue) * 100)}%`;
}


export default function DashboardHome() {
  const { user } = useAuth();
  const [produtos, setProdutos] = useState([]);
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [estoqueBaixo, setEstoqueBaixo] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function carregarDashboard() {
      try {
        const [produtosData, movimentacoesData, estoqueBaixoData, fornecedoresData] =
          await Promise.all([
            authJsonRequest("/produtos/", {}, "Erro ao carregar produtos."),
            authJsonRequest("/movimentacoes/", {}, "Erro ao carregar movimentações."),
            authJsonRequest(
              "/produtos/estoque-baixo/",
              {},
              "Erro ao carregar o alerta de estoque baixo.",
            ),
            authJsonRequest("/fornecedores/", {}, "Erro ao carregar fornecedores."),
          ]);

        setProdutos(extractCollection(produtosData));
        setMovimentacoes(extractCollection(movimentacoesData));
        setEstoqueBaixo(extractCollection(estoqueBaixoData));
        setFornecedores(extractCollection(fornecedoresData));
      } catch (error) {
        toast.error(error.message);
      }
    }

    carregarDashboard();
  }, []);

  const resumoMovimentacoes = useMemo(() => {
    return movimentacoes.reduce(
      (accumulator, movimentacao) => {
        const quantidade = Number(movimentacao.quantidade || 0);

        if (movimentacao.tipo === "entrada") {
          accumulator.entradas += quantidade;
        }

        if (movimentacao.tipo === "saida") {
          accumulator.saidas += quantidade;
        }

        return accumulator;
      },
      { entradas: 0, saidas: 0 },
    );
  }, [movimentacoes]);

  const movimentacoesRecentes = useMemo(
    () => movimentacoes.slice(0, 5),
    [movimentacoes],
  );
  const unidadesEmEstoque = useMemo(
    () =>
      produtos.reduce(
        (acumulador, produto) => acumulador + Number(produto.estoque_total || 0),
        0,
      ),
    [produtos],
  );
  const valorEstoque = useMemo(
    () =>
      produtos.reduce((acumulador, produto) => {
        return (
          acumulador +
          Number(produto.estoque_total || 0) * Number(produto.preco_custo || 0)
        );
      }, 0),
    [produtos],
  );
  const taxaEstoqueCritico = produtos.length
    ? Math.round((estoqueBaixo.length / produtos.length) * 100)
    : 0;
  const possuiAlertaEstoque = estoqueBaixo.length > 0;
  const produtosPrioritarios = useMemo(
    () => estoqueBaixo.slice(0, 3),
    [estoqueBaixo],
  );
  const statusOperacao = estoqueBaixo.length === 0 ? "Sem alertas" : `${estoqueBaixo.length} alertas`;

  const movimentacoesPorDia = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const dias = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(hoje);
      date.setDate(hoje.getDate() - (6 - index));

      return {
        key: buildDayKey(date),
        label: dayLabelFormatter.format(date),
        entradas: 0,
        saidas: 0,
      };
    });

    const mapaDias = new Map(dias.map((dia) => [dia.key, dia]));

    movimentacoes.forEach((movimentacao) => {
      const date = new Date(movimentacao.data);

      if (Number.isNaN(date.getTime())) {
        return;
      }

      date.setHours(0, 0, 0, 0);
      const key = buildDayKey(date);
      const dia = mapaDias.get(key);

      if (!dia) {
        return;
      }

      const quantidade = Number(movimentacao.quantidade || 0);

      if (movimentacao.tipo === "entrada") {
        dia.entradas += quantidade;
      }

      if (movimentacao.tipo === "saida") {
        dia.saidas += quantidade;
      }
    });

    return dias;
  }, [movimentacoes]);

  const maiorMovimentacaoDia = Math.max(
    1,
    ...movimentacoesPorDia.flatMap((dia) => [dia.entradas, dia.saidas]),
  );
  const totalMovimentadoPeriodo = resumoMovimentacoes.entradas + resumoMovimentacoes.saidas;

  return (
    <Layout title="Painel" showTopbar={false}>
      <div className="summary-grid">
        <SummaryCard
          title="Produtos"
          value={produtos.length}
          tone="blue"
          caption={`${unidadesEmEstoque} em estoque`}
        />
        <SummaryCard
          title="Estoque baixo"
          value={estoqueBaixo.length}
          tone={possuiAlertaEstoque ? "alert" : "orange"}
          caption={possuiAlertaEstoque ? `${taxaEstoqueCritico}% em alerta` : "Sem alerta"}
        />
        <SummaryCard
          title="Movimentações"
          value={movimentacoes.length}
          tone="green"
          caption={`${resumoMovimentacoes.saidas} saídas`}
        />
        <SummaryCard
          title="Fornecedores"
          value={fornecedores.length}
          tone="blue"
          caption="Cadastrados no sistema"
        />
      </div>

      <div className="dashboard-grid dashboard-grid--balanced">
        <section className="page-card section-card dashboard-chart-panel">
          <div className="section-header-inline">
            <h3 className="section-title">Semana</h3>

            <div className="dashboard-chart-legend">
              <span className="dashboard-chart-legend__item">
                <span className="dashboard-chart-legend__dot dashboard-chart-legend__dot--entry" />
                Entradas
              </span>
              <span className="dashboard-chart-legend__item">
                <span className="dashboard-chart-legend__dot dashboard-chart-legend__dot--exit" />
                Saídas
              </span>
            </div>
          </div>

          <div className="dashboard-bars">
            {movimentacoesPorDia.map((dia) => (
              <div key={dia.key} className="dashboard-bars__group">
                <div className="dashboard-bars__canvas">
                  <span
                    className="dashboard-bars__bar dashboard-bars__bar--entry"
                    style={{ height: getBarHeight(dia.entradas, maiorMovimentacaoDia) }}
                    title={`${dia.label} - Entradas: ${dia.entradas}`}
                  />
                  <span
                    className="dashboard-bars__bar dashboard-bars__bar--exit"
                    style={{ height: getBarHeight(dia.saidas, maiorMovimentacaoDia) }}
                    title={`${dia.label} - Saídas: ${dia.saidas}`}
                  />
                </div>
                <span className="dashboard-bars__label">{dia.label}</span>
              </div>
            ))}
          </div>

          <div className="dashboard-chart-summary">
            <span>Total movimentado no período</span>
            <strong>{totalMovimentadoPeriodo} unidades</strong>
          </div>
        </section>

        <section
          className={`page-card section-card dashboard-priority ${
            possuiAlertaEstoque ? "dashboard-priority--alert" : ""
          }`}
        >
          <div className="section-header-inline">
            <h3 className="section-title">Prioridades</h3>
            <span
              className={`badge ${
                possuiAlertaEstoque ? "badge-warning badge-warning--strong" : "badge-success"
              }`}
            >
              {statusOperacao}
            </span>
          </div>

          <div className="dashboard-priority__content">
            {produtosPrioritarios.length === 0 ? (
              <p className="empty-state dashboard-priority__empty">Sem reposição pendente.</p>
            ) : (
              <div className="dashboard-priority__list">
                {produtosPrioritarios.map((produto) => (
                  <article
                    key={produto.id}
                    className={`dashboard-priority__item ${
                      possuiAlertaEstoque ? "dashboard-priority__item--alert" : ""
                    }`}
                  >
                    <strong>{produto.nome}</strong>
                    <span>{produto.estoque_total}/{produto.estoque_minimo}</span>
                  </article>
                ))}
              </div>
            )}

            <div className="dashboard-priority__stats">
              <article className="dashboard-priority__stat">
                <span>Estoque</span>
                <strong>{unidadesEmEstoque}</strong>
              </article>
              <article
                className={`dashboard-priority__stat ${
                  possuiAlertaEstoque ? "dashboard-priority__stat--alert" : ""
                }`}
              >
                <span>Alertas</span>
                <strong>{estoqueBaixo.length}</strong>
              </article>
              <article className="dashboard-priority__stat">
                <span>Valor</span>
                <strong>{formatCurrency(valorEstoque)}</strong>
              </article>
            </div>

            <div className="dashboard-priority__actions">
              <button
                type="button"
                className="button-secondary dashboard-priority__button"
                onClick={() => navigate("/nova-movimentacao")}
              >
                Ajuste
              </button>
              <button
                type="button"
                className="button-secondary dashboard-priority__button"
                onClick={() => navigate("/importar-nota-fiscal")}
              >
                NF-e
              </button>
              <button
                type="button"
                className="button-secondary dashboard-priority__button"
                onClick={() => navigate(user?.tipo === "admin" ? "/novo-pedido" : "/pedidos")}
              >
                Pedido
              </button>
              <button
                type="button"
                className="button-secondary dashboard-priority__button"
                onClick={() => navigate(user?.tipo === "admin" ? "/novo-produto" : "/estoque-baixo")}
              >
                {user?.tipo === "admin" ? "Produto" : "Estoque"}
              </button>
            </div>
          </div>
        </section>
      </div>

      <div className="dashboard-grid--wide">
        <div
          className={`page-card table-card ${
            possuiAlertaEstoque ? "dashboard-reorder-card--alert" : ""
          }`}
        >
          <h3 className="section-title">Reposição</h3>
          {estoqueBaixo.length === 0 ? (
            <p className="empty-state">Nenhum produto com estoque baixo.</p>
          ) : (
            <div className="table-wrapper">
              <table className="table-modern">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Marca</th>
                    <th>Atual</th>
                    <th>Minimo</th>
                  </tr>
                </thead>
                <tbody>
                  {estoqueBaixo.slice(0, 5).map((produto) => (
                    <tr key={produto.id}>
                      <td>{produto.nome}</td>
                      <td>{produto.marca}</td>
                      <td>{produto.estoque_total}</td>
                      <td>{produto.estoque_minimo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="page-card table-card">
          <h3 className="section-title">Últimas movimentações</h3>
          {movimentacoesRecentes.length === 0 ? (
            <p className="empty-state">Nenhuma movimentacao registrada.</p>
          ) : (
            <div className="table-wrapper">
              <table className="table-modern">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Tipo</th>
                    <th>Qtd</th>
                  </tr>
                </thead>
                <tbody>
                  {movimentacoesRecentes.map((movimentacao) => (
                    <tr key={movimentacao.id}>
                      <td>{movimentacao.produto_nome}</td>
                      <td>
                        <span
                          className={`badge ${
                            movimentacao.tipo === "entrada"
                              ? "badge-success"
                              : "badge-danger"
                          }`}
                        >
                          {movimentacao.tipo === "entrada" ? "Entrada" : "Saída"}
                        </span>
                      </td>
                      <td>{movimentacao.quantidade}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
