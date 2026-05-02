import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import Layout from "../components/Layout";
import PageHeader from "../components/PageHeader";
import { authJsonRequest, extractCollection } from "../services/api";
import { formatCurrency } from "../utils/formatters";

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

function buildEmptyItem() {
  return {
    localId: `${Date.now()}-${Math.random()}`,
    variacao: "",
    quantidade: "1",
    preco_unitario: "",
  };
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
        setErro(error.message || "Erro ao carregar formulário.");
        toast.error(error.message || "Erro ao carregar formulário.");
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
    return form.itens.reduce((accumulator, item) => {
      const quantidade = Number(item.quantidade || 0);
      const preco = Number(item.preco_unitario || 0);
      return accumulator + quantidade * preco;
    }, 0);
  }, [form.itens]);

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
        throw new Error("Preencha todos os itens.");
      }

      const itemSemSaldo = form.itens.find((item) => {
        const variacaoSelecionada = variacoesPorId.get(String(item.variacao));
        return variacaoSelecionada && Number(item.quantidade || 0) > Number(variacaoSelecionada.saldo_atual || 0);
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
      setErro(error.message || "Erro ao registrar venda.");
      toast.error(error.message || "Erro ao registrar venda.");
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <Layout title="Vendas">
        <div className="page-card section-card">Carregando...</div>
      </Layout>
    );
  }

  return (
    <Layout title="Nova venda">
      <div className="form-shell form-shell--wide">
        <PageHeader title="Nova venda" />

        {erro ? <div className="alert-error">{erro}</div> : null}

        <form className="page-card form-card" onSubmit={handleSubmit}>
          <div className="form-section">
            <h3 className="section-title">Venda</h3>
            <div className="form-grid">
              <div>
                <label className="form-label">Cliente</label>
                <input
                  name="cliente_nome"
                  value={form.cliente_nome}
                  onChange={atualizarCampo}
                  required
                />
              </div>
              <div>
                <label className="form-label">Total</label>
                <input value={formatCurrency(totalVenda)} readOnly />
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="section-header-inline">
              <h3 className="section-title">Itens</h3>

              <button
                type="button"
                className="button-secondary"
                onClick={adicionarItem}
              >
                Adicionar
              </button>
            </div>

            <div style={{ display: "grid", gap: "14px" }}>
              {form.itens.map((item, index) => (
                <div key={item.localId} className="highlight-panel">
                  <div className="section-header-inline">
                    <h4 className="section-title" style={{ marginBottom: 0 }}>
                      Item {index + 1}
                    </h4>

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

                  <div className="form-grid">
                    {(() => {
                      const variacaoSelecionada = variacoesPorId.get(String(item.variacao));
                      const quantidadeSolicitada = Number(item.quantidade || 0);
                      const saldoDisponivel = Number(variacaoSelecionada?.saldo_atual || 0);
                      const possuiSaldoInsuficiente =
                        Boolean(item.variacao) &&
                        quantidadeSolicitada > saldoDisponivel;

                      return (
                        <>
                          <div style={{ gridColumn: "1 / -1" }}>
                            <label className="form-label">Variação</label>
                            <select
                              value={item.variacao}
                              onChange={(event) =>
                                atualizarItem(item.localId, "variacao", event.target.value)
                              }
                              required
                            >
                              <option value="">Selecione</option>
                              {variacoesOrdenadas.map((variacao) => (
                                <option key={variacao.id} value={variacao.id}>
                                  {buildVariacaoLabel(variacao)}
                                </option>
                              ))}
                            </select>
                            {variacaoSelecionada ? (
                              <p className="table-inline-note">
                                Saldo: {saldoDisponivel}
                              </p>
                            ) : null}
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
                              <p className="alert-error" style={{ marginTop: "8px" }}>
                                Acima do saldo.
                              </p>
                            ) : null}
                          </div>
                          <div>
                            <label className="form-label">Preço</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.preco_unitario}
                              onChange={(event) =>
                                atualizarItem(item.localId, "preco_unitario", event.target.value)
                              }
                              required
                            />
                          </div>
                          <div>
                            <label className="form-label">Subtotal</label>
                            <input
                              value={formatCurrency(
                                Number(item.quantidade || 0) * Number(item.preco_unitario || 0),
                              )}
                              readOnly
                            />
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="button-secondary"
              onClick={() => navigate("/pedidos")}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="button-primary"
              disabled={salvando}
            >
              {salvando ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
