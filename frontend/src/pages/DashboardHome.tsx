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

export default function DashboardHome() {
  const { user } = useAuth();
  const [produtos, setProdutos] = useState([]);
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [estoqueBaixo, setEstoqueBaixo] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function carregarDashboard() {
      try {
        const [produtosData, movimentacoesData, estoqueBaixoData] = await Promise.all([
          authJsonRequest("/produtos/", {}, "Erro ao carregar produtos."),
          authJsonRequest("/movimentacoes/", {}, "Erro ao carregar movimentações."),
          authJsonRequest(
            "/produtos/estoque-baixo/",
            {},
            "Erro ao carregar o alerta de estoque baixo.",
          ),
        ]);

        setProdutos(extractCollection(produtosData));
        setMovimentacoes(extractCollection(movimentacoesData));
        setEstoqueBaixo(extractCollection(estoqueBaixoData));
      } catch (error) {
        toast.error(error.message);
      }
    }

    carregarDashboard();
  }, []);

  const movimentacoesRecentes = useMemo(() => {
    return [...movimentacoes]
      .sort((primeira, segunda) => {
        const primeiraData = new Date(primeira.data).getTime();
        const segundaData = new Date(segunda.data).getTime();

        return segundaData - primeiraData;
      })
      .slice(0, 5);
  }, [movimentacoes]);

  const unidadesEmEstoque = useMemo(() => {
    return produtos.reduce(
      (acumulador, produto) => acumulador + Number(produto.estoque_total || 0),
      0,
    );
  }, [produtos]);

  const valorEstoque = useMemo(() => {
    return produtos.reduce((acumulador, produto) => {
      return (
        acumulador +
        Number(produto.estoque_total || 0) * Number(produto.preco_custo || 0)
      );
    }, 0);
  }, [produtos]);

  const taxaEstoqueCritico = produtos.length
    ? Math.round((estoqueBaixo.length / produtos.length) * 100)
    : 0;
  const possuiAlertaEstoque = estoqueBaixo.length > 0;
  const produtoMaisCritico = estoqueBaixo[0] || null;

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

  const totalMovimentadoPeriodo = useMemo(() => {
    return movimentacoesPorDia.reduce(
      (acumulador, dia) => acumulador + dia.entradas + dia.saidas,
      0,
    );
  }, [movimentacoesPorDia]);

  const diasComMovimento = useMemo(() => {
    return movimentacoesPorDia.filter((dia) => dia.entradas + dia.saidas > 0).length;
  }, [movimentacoesPorDia]);

  const ultimaAtividade = useMemo(() => {
    return [...movimentacoesPorDia]
      .reverse()
      .find((dia) => dia.entradas + dia.saidas > 0) || null;
  }, [movimentacoesPorDia]);

  const tituloResumo = possuiAlertaEstoque
    ? "Alguns itens precisam de reposição."
    : "A operação está organizada.";
  const descricaoResumo = possuiAlertaEstoque
    ? `${estoqueBaixo.length} produtos estão abaixo do mínimo. Priorize a reposição dos itens críticos para evitar ruptura.`
    : "Não há produtos em situação crítica no momento. O estoque segue estável para a operação atual.";
  const descricaoSemana =
    totalMovimentadoPeriodo > 0
      ? `${totalMovimentadoPeriodo} unidades movimentadas nos últimos 7 dias, com atividade em ${diasComMovimento} dias.`
      : "Ainda não houve movimentações registradas nos últimos 7 dias.";
  const rotaProduto = user?.tipo === "admin" ? "/novo-produto" : "/estoque-baixo";
  const rotuloProduto = user?.tipo === "admin" ? "Novo produto" : "Ver alertas";

  return (
    <Layout title="Painel" showTopbar={false}>
      <div className="dashboard-home">
        <div className="summary-grid dashboard-home__summary">
          <SummaryCard
            title="Produtos"
            value={produtos.length}
            tone="blue"
            caption={`${unidadesEmEstoque} unidades em estoque`}
          />
          <SummaryCard
            title="Estoque baixo"
            value={estoqueBaixo.length}
            tone={possuiAlertaEstoque ? "alert" : "orange"}
            caption={possuiAlertaEstoque ? `${taxaEstoqueCritico}% da base em alerta` : "Sem alerta"}
          />
          <SummaryCard
            title="Movimentado"
            value={totalMovimentadoPeriodo}
            tone="green"
            caption="Últimos 7 dias"
          />
          <SummaryCard
            title="Valor em estoque"
            value={formatCurrency(valorEstoque)}
            tone="blue"
            caption="Estimativa pelo custo"
          />
        </div>

        <section
          className={`page-card section-card dashboard-home__overview ${
            possuiAlertaEstoque ? "dashboard-home__overview--alert" : ""
          }`}
        >
          <div className="dashboard-home__overview-main">
            <span className="dashboard-home__eyebrow">Resumo da operação</span>
            <h2 className="dashboard-home__headline">{tituloResumo}</h2>
            <p className="dashboard-home__description">
              {descricaoResumo} {descricaoSemana}
            </p>

            <div className="dashboard-home__mini-grid">
              <article className="dashboard-home__mini-card">
                <span>Valor estimado</span>
                <strong>{formatCurrency(valorEstoque)}</strong>
                <small>Baseado no custo cadastrado</small>
              </article>

              <article className="dashboard-home__mini-card">
                <span>Última atividade</span>
                <strong>{ultimaAtividade ? ultimaAtividade.label : "Sem registro"}</strong>
                <small>
                  {ultimaAtividade
                    ? `${ultimaAtividade.entradas + ultimaAtividade.saidas} unidades no dia`
                    : "Sem movimentação recente"}
                </small>
              </article>

              <article
                className={`dashboard-home__mini-card ${
                  possuiAlertaEstoque ? "dashboard-home__mini-card--alert" : ""
                }`}
              >
                <span>Reposição crítica</span>
                <strong>{produtoMaisCritico ? produtoMaisCritico.nome : "Sem pendências"}</strong>
                <small>
                  {produtoMaisCritico
                    ? `${produtoMaisCritico.estoque_total}/${produtoMaisCritico.estoque_minimo} em estoque`
                    : "Todos os itens acima do mínimo"}
                </small>
              </article>
            </div>
          </div>

          <div className="dashboard-home__actions">
            <button
              type="button"
              className="button-primary dashboard-home__action-button"
              onClick={() => navigate("/nova-movimentacao")}
            >
              Registrar movimentação
            </button>
            <button
              type="button"
              className="button-secondary dashboard-home__action-button"
              onClick={() => navigate("/importar-nota-fiscal")}
            >
              Importar NF-e
            </button>
            <button
              type="button"
              className="button-secondary dashboard-home__action-button"
              onClick={() => navigate(rotaProduto)}
            >
              {rotuloProduto}
            </button>
          </div>
        </section>

        <div className="dashboard-home__content">
          <section
            className={`page-card table-card dashboard-home__table-card ${
              possuiAlertaEstoque ? "dashboard-home__table-card--alert" : ""
            }`}
          >
            <div className="section-header-inline">
              <div>
                <h3 className="section-title">Estoque baixo</h3>
                <p className="table-inline-note">
                  Produtos que pedem reposição com mais urgência.
                </p>
              </div>
              <button
                type="button"
                className="button-linkish"
                onClick={() => navigate("/estoque-baixo")}
              >
                Ver lista completa
              </button>
            </div>

            {estoqueBaixo.length === 0 ? (
              <p className="empty-state dashboard-home__empty">
                Nenhum produto com estoque baixo.
              </p>
            ) : (
              <div className="table-wrapper">
                <table className="table-modern">
                  <thead>
                    <tr>
                      <th>Produto</th>
                      <th>Marca</th>
                      <th>Atual</th>
                      <th>Mínimo</th>
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
          </section>

          <section className="page-card table-card dashboard-home__table-card">
            <div className="section-header-inline">
              <div>
                <h3 className="section-title">Últimas movimentações</h3>
                <p className="table-inline-note">
                  Registros mais recentes da operação.
                </p>
              </div>
              <button
                type="button"
                className="button-linkish"
                onClick={() => navigate("/movimentacoes")}
              >
                Ver histórico
              </button>
            </div>

            {movimentacoesRecentes.length === 0 ? (
              <p className="empty-state dashboard-home__empty">
                Nenhuma movimentação registrada.
              </p>
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
          </section>
        </div>
      </div>
    </Layout>
  );
}
