import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import SummaryCard from "@/components/dashboard/SummaryCard";
import Layout from "@/components/layout/Layout";
import PageHeader from "@/components/layout/PageHeader";
import { authJsonRequest, extractCollection } from "@/services/api";
import { formatCurrency } from "@/utils/formatters";

function buildVariacaoLabel(variacao) {
  const partes = [variacao.produto_nome];

  if (variacao.cor) {
    partes.push(variacao.cor);
  }
  if (variacao.tamanho) {
    partes.push(`Tam. ${variacao.tamanho}`);
  }
  if (variacao.numeracao) {
    partes.push(`Num. ${variacao.numeracao}`);
  }

  partes.push(`Saldo ${variacao.saldo_atual}`);
  return partes.join(" | ");
}

function buildVariacaoOptionLabel(variacao) {
  return `${buildVariacaoLabel(variacao)} | ${formatCurrency(variacao.produto_preco_venda)}`;
}

function buildVariacaoResumo(variacao) {
  const partes = [];

  if (variacao.cor) {
    partes.push(`Cor ${variacao.cor}`);
  }
  if (variacao.tamanho) {
    partes.push(`Tamanho ${variacao.tamanho}`);
  }
  if (variacao.numeracao) {
    partes.push(`Numeração ${variacao.numeracao}`);
  }

  return partes.join(" | ") || "Variação sem detalhamento complementar";
}

function buildEmptyItem() {
  return {
    localId: `${Date.now()}-${Math.random()}`,
    variacao: "",
    quantidade: "1",
    preco_unitario: "",
  };
}

function calcularSubtotal(item) {
  return Number(item.quantidade || 0) * Number(item.preco_unitario || 0);
}

export default function PedidoFormPage() {
  const navigate = useNavigate();
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [variacoes, setVariacoes] = useState([]);
  const [form, setForm] = useState({
    cliente_nome: "",
    itens: [buildEmptyItem()],
  });

  useEffect(() => {
    async function carregarDados() {
      try {
        const variacoesData = await authJsonRequest(
          "/variacoes/",
          {},
          "Erro ao carregar variações.",
        );
        setVariacoes(extractCollection(variacoesData));
      } catch (error) {
        const message = error.message || "Erro ao carregar formulario.";
        setErro(message);
        toast.error(message);
      } finally {
        setCarregando(false);
      }
    }

    carregarDados();
  }, []);

  const variacoesOrdenadas = useMemo(() => {
    return [...variacoes].sort((a, b) =>
      buildVariacaoLabel(a).localeCompare(buildVariacaoLabel(b), "pt-BR"),
    );
  }, [variacoes]);

  const variacoesPorId = useMemo(
    () => new Map(variacoes.map((variacao) => [String(variacao.id), variacao])),
    [variacoes],
  );

  const totalVenda = useMemo(() => {
    return form.itens.reduce(
      (accumulator, item) => accumulator + calcularSubtotal(item),
      0,
    );
  }, [form.itens]);

  const totalUnidades = useMemo(() => {
    return form.itens.reduce(
      (accumulator, item) => accumulator + Number(item.quantidade || 0),
      0,
    );
  }, [form.itens]);

  const itensCompletos = useMemo(() => {
    return form.itens.filter(
      (item) => item.variacao && item.quantidade && item.preco_unitario,
    ).length;
  }, [form.itens]);

  const vendaProntaParaSalvar = useMemo(() => {
    if (!form.cliente_nome.trim()) {
      return false;
    }

    return form.itens.every((item) => {
      if (!item.variacao || !item.quantidade || !item.preco_unitario) {
        return false;
      }

      const variacaoSelecionada = variacoesPorId.get(String(item.variacao));
      return (
        variacaoSelecionada &&
        Number(item.quantidade || 0) <= Number(variacaoSelecionada.saldo_atual || 0)
      );
    });
  }, [form.cliente_nome, form.itens, variacoesPorId]);

  const checklistItems = [
    {
      done: Boolean(form.cliente_nome.trim()),
      label: "Cliente identificado",
    },
    {
      done: itensCompletos === form.itens.length,
      label: "Todos os itens preenchidos",
    },
    {
      done: vendaProntaParaSalvar,
      label: "Venda pronta para salvar",
    },
  ];

  function atualizarCampo(event) {
    setForm((prevState) => ({
      ...prevState,
      [event.target.name]: event.target.value,
    }));
  }

  function atualizarItem(localId, field, value) {
    setForm((prevState) => ({
      ...prevState,
      itens: prevState.itens.map((item) =>
        item.localId === localId ? { ...item, [field]: value } : item,
      ),
    }));
  }

  function selecionarVariacao(localId, variacaoId) {
    const variacaoSelecionada = variacoesPorId.get(String(variacaoId));
    const precoPadrao = variacaoSelecionada?.produto_preco_venda
      ? String(variacaoSelecionada.produto_preco_venda)
      : "";

    setForm((prevState) => ({
      ...prevState,
      itens: prevState.itens.map((item) => {
        if (item.localId !== localId) {
          return item;
        }

        return {
          ...item,
          variacao: variacaoId,
          preco_unitario: precoPadrao,
        };
      }),
    }));
  }

  function adicionarItem() {
    setForm((prevState) => ({
      ...prevState,
      itens: [...prevState.itens, buildEmptyItem()],
    }));
  }

  function removerItem(localId) {
    setForm((prevState) => ({
      ...prevState,
      itens:
        prevState.itens.length > 1
          ? prevState.itens.filter((item) => item.localId !== localId)
          : prevState.itens,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErro("");
    setSalvando(true);

    try {
      const payload = {
        cliente_nome: form.cliente_nome,
        itens: form.itens.map((item) => ({
          variacao: Number(item.variacao),
          quantidade: Number(item.quantidade),
          preco_unitario: item.preco_unitario,
        })),
      };

      if (payload.itens.some((item) => !item.variacao || !item.quantidade || !item.preco_unitario)) {
        throw new Error("Preencha todos os itens da venda.");
      }

      const itemSemSaldo = form.itens.find((item) => {
        const variacaoSelecionada = variacoesPorId.get(String(item.variacao));
        return (
          variacaoSelecionada &&
          Number(item.quantidade || 0) > Number(variacaoSelecionada.saldo_atual || 0)
        );
      });

      if (itemSemSaldo) {
        const variacaoSelecionada = variacoesPorId.get(String(itemSemSaldo.variacao));
        throw new Error(
          `${variacaoSelecionada?.produto_nome || "A variação"} não possui saldo suficiente.`,
        );
      }

      await authJsonRequest(
        "/pedidos/",
        {
          method: "POST",
          body: payload,
        },
        "Erro ao registrar venda.",
      );

      toast.success("Venda registrada com sucesso.");
      navigate("/pedidos");
    } catch (error) {
      const message = error.message || "Erro ao registrar venda.";
      setErro(message);
      toast.error(message);
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <Layout title="Nova venda">
        <div className="page-card section-card">Carregando...</div>
      </Layout>
    );
  }

  return (
    <Layout title="Nova venda">
      <div className="sales-page sales-page--composer">
        <PageHeader
          title="Nova venda"
          description="Monte o pedido com mais segurança, acompanhe o total em tempo real e revise os itens antes de concluir o registro."
          action={(
            <button
              type="button"
              className="button-secondary"
              onClick={() => navigate("/pedidos")}
            >
              Ver histórico
            </button>
          )}
        />

        <div className="summary-grid sales-page__summary">
          <SummaryCard
            title="Cliente"
            value={form.cliente_nome.trim() || "A definir"}
            tone="blue"
            caption="Identificação da venda"
          />
          <SummaryCard
            title="Itens lançados"
            value={`${itensCompletos}/${form.itens.length}`}
            tone="orange"
            caption={`${totalUnidades} unidades no pedido`}
          />
          <SummaryCard
            title="Total parcial"
            value={formatCurrency(totalVenda)}
            tone="green"
            caption={
              vendaProntaParaSalvar
                ? "Pronto para registrar."
                : "Revise os campos obrigatórios."
            }
          />
        </div>

        {erro ? <div className="alert-error">{erro}</div> : null}

        <div className="sales-composer">
          <form
            id="sales-order-form"
            className="page-card form-card sales-form-card"
            onSubmit={handleSubmit}
          >
            <div className="form-section sales-form-intro">
              <div className="sales-form-intro__head">
                <div>
                  <span className="sales-eyebrow">Identificação da venda</span>
                  <h3 className="section-title">Dados gerais</h3>
                  <p className="section-subtitle sales-section__subtitle">
                    Informe o cliente e acompanhe o total parcial enquanto monta o pedido.
                  </p>
                </div>

                <div className="sales-total-preview">
                  <span className="sales-total-preview__label">Total parcial</span>
                  <strong className="sales-total-preview__value">
                    {formatCurrency(totalVenda)}
                  </strong>
                  <small className="sales-total-preview__caption">
                    {totalUnidades} unidades em {form.itens.length} item(ns)
                  </small>
                </div>
              </div>

              <div className="form-grid">
                <div>
                  <label className="form-label">Cliente</label>
                  <input
                    name="cliente_nome"
                    placeholder="Nome do cliente"
                    value={form.cliente_nome}
                    onChange={atualizarCampo}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Itens preenchidos</label>
                  <input
                    value={`${itensCompletos} de ${form.itens.length} item(ns) prontos`}
                    readOnly
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <div className="section-header-inline">
                <div>
                  <h3 className="section-title">Itens do pedido</h3>
                  <p className="section-subtitle sales-section__subtitle">
                    Selecione a variação e o sistema já traz o preço de venda cadastrado para agilizar o lançamento.
                  </p>
                </div>

                <button
                  type="button"
                  className="button-secondary"
                  onClick={adicionarItem}
                >
                  Adicionar item
                </button>
              </div>

              <div className="sales-items-list">
                {form.itens.map((item, index) => {
                  const variacaoSelecionada = variacoesPorId.get(String(item.variacao));
                  const quantidadeSolicitada = Number(item.quantidade || 0);
                  const saldoDisponivel = Number(variacaoSelecionada?.saldo_atual || 0);
                  const possuiSaldoInsuficiente =
                    Boolean(item.variacao) &&
                    quantidadeSolicitada > saldoDisponivel;

                  return (
                    <article
                      key={item.localId}
                      className={`sales-item-card ${possuiSaldoInsuficiente ? "sales-item-card--warning" : ""}`}
                    >
                      <div className="sales-item-card__header">
                        <div>
                          <span className="sales-item-card__eyebrow">
                            Item {String(index + 1).padStart(2, "0")}
                          </span>
                          <h4 className="sales-item-card__title">
                            {variacaoSelecionada
                              ? variacaoSelecionada.produto_nome
                              : "Selecione uma variação"}
                          </h4>
                          <p className="table-cell-meta">
                            {variacaoSelecionada
                              ? buildVariacaoResumo(variacaoSelecionada)
                              : "Escolha o produto e seus atributos para continuar."}
                          </p>
                        </div>

                        <div className="sales-item-card__actions">
                          <span
                            className={`sales-stock-badge ${possuiSaldoInsuficiente ? "sales-stock-badge--alert" : "sales-stock-badge--ok"}`}
                          >
                            Saldo {saldoDisponivel}
                          </span>

                          {form.itens.length > 1 ? (
                            <button
                              type="button"
                              className="button-linkish"
                              onClick={() => removerItem(item.localId)}
                            >
                              Remover
                            </button>
                          ) : null}
                        </div>
                      </div>

                      {variacaoSelecionada ? (
                        <div className="sales-item-card__overview">
                          <div className="sales-item-card__meta-card">
                            <span className="sales-item-card__meta-label">Produto</span>
                            <strong className="sales-item-card__meta-value">
                              {variacaoSelecionada.produto_nome}
                            </strong>
                          </div>
                          <div className="sales-item-card__meta-card">
                            <span className="sales-item-card__meta-label">Disponível</span>
                            <strong className="sales-item-card__meta-value">{saldoDisponivel}</strong>
                          </div>
                          <div className="sales-item-card__meta-card">
                            <span className="sales-item-card__meta-label">Preço padrão</span>
                            <strong className="sales-item-card__meta-value">
                              {formatCurrency(variacaoSelecionada.produto_preco_venda)}
                            </strong>
                          </div>
                          <div className="sales-item-card__meta-card">
                            <span className="sales-item-card__meta-label">Subtotal</span>
                            <strong className="sales-item-card__meta-value">
                              {formatCurrency(calcularSubtotal(item))}
                            </strong>
                          </div>
                        </div>
                      ) : null}

                      <div className="form-grid">
                        <div style={{ gridColumn: "1 / -1" }}>
                          <label className="form-label">Variação</label>
                          <select
                            value={item.variacao}
                            onChange={(event) =>
                              selecionarVariacao(item.localId, event.target.value)
                            }
                            required
                          >
                            <option value="">Selecione</option>
                            {variacoesOrdenadas.map((variacao) => (
                              <option key={variacao.id} value={variacao.id}>
                                {buildVariacaoOptionLabel(variacao)}
                              </option>
                            ))}
                          </select>
                          <p className="table-cell-meta sales-input-note">
                            Ao selecionar o item, o preço unitário é preenchido automaticamente com o valor de venda cadastrado.
                          </p>
                        </div>

                        <div>
                          <label className="form-label">Quantidade</label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantidade}
                            onChange={(event) =>
                              atualizarItem(item.localId, "quantidade", event.target.value)
                            }
                            required
                          />
                          {possuiSaldoInsuficiente ? (
                            <p className="alert-error sales-inline-error">
                              Quantidade acima do saldo disponível.
                            </p>
                          ) : null}
                        </div>

                        <div>
                          <label className="form-label">Preço unitário</label>
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            placeholder="0,00"
                            value={item.preco_unitario}
                            onChange={(event) =>
                              atualizarItem(item.localId, "preco_unitario", event.target.value)
                            }
                            required
                          />
                          <p className="table-cell-meta sales-input-note">
                            Valor sugerido automaticamente. Ajuste apenas se precisar registrar um preço diferente.
                          </p>
                        </div>

                        <div>
                          <label className="form-label">Subtotal</label>
                          <input value={formatCurrency(calcularSubtotal(item))} readOnly />
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </form>

          <aside className="page-card notice-card sales-sidebar">
            <div className="sales-sidebar__header">
              <span className="sales-eyebrow">Conferência final</span>
              <h3 className="section-title">Resumo da venda</h3>
              <p className="section-subtitle sales-section__subtitle">
                Confira os dados essenciais antes de registrar o pedido no sistema.
              </p>
            </div>

            <div className="sales-sidebar__panels">
              <div className="sales-sidebar__panel">
                <span className="sales-sidebar__label">Cliente</span>
                <strong className="sales-sidebar__value">
                  {form.cliente_nome.trim() || "Não informado"}
                </strong>
              </div>

              <div className="sales-sidebar__panel">
                <span className="sales-sidebar__label">Itens prontos</span>
                <strong className="sales-sidebar__value">
                  {itensCompletos} de {form.itens.length}
                </strong>
              </div>

              <div className="sales-sidebar__panel sales-sidebar__panel--strong">
                <span className="sales-sidebar__label">Total a registrar</span>
                <strong className="sales-sidebar__value">{formatCurrency(totalVenda)}</strong>
              </div>
            </div>

            <div className="sales-checklist">
              {checklistItems.map((item) => (
                <div
                  key={item.label}
                  className={`sales-checkpoint ${
                    item.done ? "sales-checkpoint--done" : "sales-checkpoint--pending"
                  }`}
                >
                  <span className="sales-checkpoint__icon" aria-hidden="true">
                    {item.done ? "✅" : "⬜"}
                  </span>
                  <span className="sales-checkpoint__text">{item.label}</span>
                </div>
              ))}
            </div>

            <div className="sales-sidebar__actions">
              <button
                type="button"
                className="button-secondary"
                onClick={() => navigate("/pedidos")}
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="sales-order-form"
                className="button-primary"
                disabled={salvando}
              >
                {salvando ? "Salvando..." : "Registrar venda"}
              </button>
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
}
