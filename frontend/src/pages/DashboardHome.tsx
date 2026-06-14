import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import SummaryCard from "@/components/dashboard/SummaryCard";
import Layout from "@/components/layout/Layout";
import PageHeader from "@/components/layout/PageHeader";
import VariationsPreview from "@/components/products/VariationsPreview";
import { authJsonRequest, extractCollection } from "@/services/api";

export default function DashboardHome() {
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
            "Erro ao carregar o estoque baixo.",
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

  const totalMovimentadoPeriodo = useMemo(() => {
    const limite = new Date();
    limite.setHours(0, 0, 0, 0);
    limite.setDate(limite.getDate() - 6);

    return movimentacoes.reduce((acumulador, movimentacao) => {
      const dataMovimentacao = new Date(movimentacao.data);

      if (Number.isNaN(dataMovimentacao.getTime()) || dataMovimentacao < limite) {
        return acumulador;
      }

      return acumulador + Number(movimentacao.quantidade || 0);
    }, 0);
  }, [movimentacoes]);

  return (
    <Layout title="Painel">
      <div className="dashboard-home">
        <PageHeader
          title="Painel"
          description="Acompanhe o resumo do estoque e acesse os lançamentos mais usados do sistema."
          action={(
            <>
              <button
                type="button"
                className="button-secondary"
                onClick={() => navigate("/nova-movimentacao")}
              >
                Nova movimentação
              </button>
              <button
                type="button"
                className="button-primary"
                onClick={() => navigate("/novo-pedido")}
              >
                Nova venda
              </button>
            </>
          )}
        />

        <div className="summary-grid dashboard-home__summary">
          <SummaryCard
            title="Produtos"
            value={produtos.length}
            tone="blue"
            caption={`${unidadesEmEstoque} em estoque`}
          />
          <SummaryCard
            title="Estoque baixo"
            value={estoqueBaixo.length}
            tone={estoqueBaixo.length > 0 ? "alert" : "orange"}
            caption={estoqueBaixo.length > 0 ? "Precisa repor" : "Tudo certo"}
          />
          <SummaryCard
            title="Movimentado"
            value={totalMovimentadoPeriodo}
            tone="green"
            caption="Últimos 7 dias"
          />
        </div>

        <div className="dashboard-home__content">
          <section className="page-card table-card dashboard-home__table-card">
            <div className="section-header-inline">
              <h3 className="section-title">Estoque baixo</h3>
              <button
                type="button"
                className="button-linkish"
                onClick={() => navigate("/estoque-baixo")}
              >
                Ver todos
              </button>
            </div>

            {estoqueBaixo.length === 0 ? (
              <p className="empty-state dashboard-home__empty">Nenhum alerta.</p>
            ) : (
              <div className="table-wrapper">
                <table className="table-modern">
                  <thead>
                    <tr>
                      <th>Produto</th>
                      <th>Atual</th>
                      <th>Min</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estoqueBaixo.slice(0, 5).map((produto) => (
                      <tr key={produto.id}>
                        <td>
                          <div className="table-cell-primary">{produto.nome}</div>
                          <div className="table-cell-meta">{produto.marca || "-"}</div>
                          <VariationsPreview
                            variacoes={produto.variacoes}
                            maxItems={2}
                            showSaldo
                          />
                        </td>
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
              <h3 className="section-title">Últimas movimentações</h3>
              <button
                type="button"
                className="button-linkish"
                onClick={() => navigate("/movimentacoes")}
              >
                Ver histórico
              </button>
            </div>

            {movimentacoesRecentes.length === 0 ? (
              <p className="empty-state dashboard-home__empty">Nenhum registro.</p>
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
