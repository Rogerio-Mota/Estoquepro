import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import Layout from "../components/Layout";
import PageHeader from "../components/PageHeader";
import { authJsonRequest, extractCollection } from "../services/api";
import { formatCurrency } from "../utils/formatters";


function buildVariacaoLabel(variacao) {
  const partes = [variacao.produto_nome, `SKU ${variacao.produto_sku}`];

  if (variacao.cor) {
    partes.push(`Cor ${variacao.cor}`);
  }
  if (variacao.tamanho) {
    partes.push(`Tam ${variacao.tamanho}`);
  }
  if (variacao.numeracao) {
    partes.push(`Num ${variacao.numeracao}`);
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


function getStatusOptions(statusOriginal) {
  if (statusOriginal === "finalizado") {
    return [
      { value: "finalizado", label: "Finalizado" },
      { value: "cancelado", label: "Cancelado" },
    ];
  }

  if (statusOriginal === "cancelado") {
    return [{ value: "cancelado", label: "Cancelado" }];
  }

  return [
    { value: "rascunho", label: "Rascunho" },
    { value: "finalizado", label: "Finalizado" },
    { value: "cancelado", label: "Cancelado" },
  ];
}


export default function PedidoFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const editando = Boolean(id);
  const [carregando, setCarregando] = useState(editando);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [statusOriginal, setStatusOriginal] = useState("rascunho");
  const [variacoes, setVariacoes] = useState([]);
  const [form, setForm] = useState({
    cliente_nome: "",
    cliente_documento: "",
    status: "rascunho",
    observacao: "",
    itens: [buildEmptyItem()],
  });

  useEffect(() => {
    async function carregarDados() {
      try {
        const requests = [
          authJsonRequest("/variacoes/", {}, "Erro ao carregar variações."),
        ];

        if (editando) {
          requests.push(authJsonRequest(`/pedidos/${id}/`, {}, "Erro ao carregar pedido."));
        }

        const [variacoesData, pedidoData] = await Promise.all(requests);
        setVariacoes(extractCollection(variacoesData));

        if (pedidoData) {
          setStatusOriginal(pedidoData.status);
          setForm({
            cliente_nome: pedidoData.cliente_nome || "",
            cliente_documento: pedidoData.cliente_documento || "",
            status: pedidoData.status || "rascunho",
            observacao: pedidoData.observacao || "",
            itens:
              pedidoData.itens?.map((item) => ({
                localId: String(item.id),
                variacao: String(item.variacao),
                quantidade: String(item.quantidade),
                preco_unitario: String(item.preco_unitario),
              })) || [buildEmptyItem()],
          });
        }
      } catch (error) {
        setErro(error.message || "Erro ao carregar formulário.");
        toast.error(error.message || "Erro ao carregar formulário.");
      } finally {
        setCarregando(false);
      }
    }

    carregarDados();
  }, [editando, id]);

  const variacoesOrdenadas = useMemo(() => {
    return [...variacoes].sort((a, b) =>
      buildVariacaoLabel(a).localeCompare(buildVariacaoLabel(b), "pt-BR"),
    );
  }, [variacoes]);
  const variacoesPorId = useMemo(
    () => new Map(variacoes.map((variacao) => [String(variacao.id), variacao])),
    [variacoes],
  );

  const pedidoBloqueado = statusOriginal === "cancelado";
  const itensBloqueados = editando && statusOriginal !== "rascunho";
  const totalPedido = useMemo(() => {
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
        cliente_documento: form.cliente_documento || null,
        status: form.status,
        observacao: form.observacao || "",
        itens: form.itens.map((item) => ({
          variacao: Number(item.variacao),
          quantidade: Number(item.quantidade),
          preco_unitario: item.preco_unitario,
        })),
      };

      if (payload.itens.some((item) => !item.variacao || !item.quantidade || !item.preco_unitario)) {
        throw new Error("Preencha todos os campos dos itens para salvar o pedido.");
      }

      if (form.status === "finalizado") {
        const itemSemSaldo = form.itens.find((item) => {
          const variacaoSelecionada = variacoesPorId.get(String(item.variacao));
          return variacaoSelecionada && Number(item.quantidade || 0) > Number(variacaoSelecionada.saldo_atual || 0);
        });

        if (itemSemSaldo) {
          const variacaoSelecionada = variacoesPorId.get(String(itemSemSaldo.variacao));
          throw new Error(
            `${variacaoSelecionada?.produto_nome || "A variação selecionada"} possui saldo insuficiente. ` +
            `Disponível: ${variacaoSelecionada?.saldo_atual || 0}. Pedido: ${Number(itemSemSaldo.quantidade || 0)}.`,
          );
        }
      }

      await authJsonRequest(
        editando ? `/pedidos/${id}/` : "/pedidos/",
        {
          method: editando ? "PUT" : "POST",
          body: payload,
        },
        editando ? "Erro ao atualizar pedido." : "Erro ao criar pedido.",
      );

      toast.success(
        form.status === "finalizado"
          ? "Pedido salvo e estoque baixado automaticamente."
          : form.status === "cancelado"
          ? "Pedido cancelado e estoque estornado quando necessário."
            : "Pedido salvo com sucesso.",
      );
      navigate("/pedidos");
    } catch (error) {
      setErro(error.message || "Erro ao salvar pedido.");
      toast.error(error.message || "Erro ao salvar pedido.");
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <Layout title="Pedidos">
        <div className="page-card section-card">Carregando pedido...</div>
      </Layout>
    );
  }

  return (
    <Layout title={editando ? "Editar Pedido" : "Novo Pedido"}>
      <div className="form-shell form-shell--wide">
        <PageHeader
          title={editando ? "Gerenciar pedido" : "Novo pedido"}
          description="Monte os itens da venda e escolha o momento certo para baixar o estoque automaticamente."
        />

        {erro ? <div className="alert-error">{erro}</div> : null}

        <div className="highlight-panel">
          Ao salvar como `finalizado`, o sistema gera as saídas automaticamente.
          Ao cancelar um pedido finalizado, o estoque retorna para as variações do pedido.
        </div>

        <form className="page-card form-card" onSubmit={handleSubmit}>
          <div className="form-section">
            <h3 className="section-title">Cabeçalho do pedido</h3>
            <div className="form-grid">
              <div>
                <label className="form-label">Cliente</label>
                <input
                  name="cliente_nome"
                  value={form.cliente_nome}
                  onChange={atualizarCampo}
                  required
                  disabled={pedidoBloqueado}
                />
              </div>
              <div>
                <label className="form-label">Documento</label>
                <input
                  name="cliente_documento"
                  value={form.cliente_documento}
                  onChange={atualizarCampo}
                  placeholder="CPF ou CNPJ"
                  disabled={pedidoBloqueado}
                />
              </div>
              <div>
                <label className="form-label">Status</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={atualizarCampo}
                  disabled={pedidoBloqueado}
                >
                  {getStatusOptions(statusOriginal).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Total previsto</label>
                <input value={formatCurrency(totalPedido)} readOnly />
              </div>
            </div>

            <div style={{ marginTop: "16px" }}>
              <label className="form-label">Observação</label>
              <textarea
                name="observacao"
                rows={3}
                value={form.observacao}
                onChange={atualizarCampo}
                disabled={pedidoBloqueado}
              />
            </div>
          </div>

          <div className="form-section">
            <div className="section-header-inline">
              <div>
                <h3 className="section-title">Itens do pedido</h3>
                <p className="section-subtitle">
                  Cada linha representa uma variação vendida e o sistema usa essas informações
                  para gerar a baixa de estoque.
                </p>
              </div>

              {!itensBloqueados && !pedidoBloqueado ? (
                <button
                  type="button"
                  className="button-secondary"
                  onClick={adicionarItem}
                >
                  Adicionar Item
                </button>
              ) : null}
            </div>

            <div style={{ display: "grid", gap: "14px" }}>
              {form.itens.map((item, index) => (
                <div key={item.localId} className="highlight-panel">
                  <div className="section-header-inline">
                    <h4 className="section-title" style={{ marginBottom: 0 }}>
                      Item {index + 1}
                    </h4>

                    {!itensBloqueados && !pedidoBloqueado && form.itens.length > 1 ? (
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
                        form.status === "finalizado" &&
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
                        disabled={itensBloqueados || pedidoBloqueado}
                        required
                      >
                        <option value="">Selecione a variação</option>
                        {variacoesOrdenadas.map((variacao) => (
                          <option key={variacao.id} value={variacao.id}>
                            {buildVariacaoLabel(variacao)}
                          </option>
                          ))}
                        </select>
                        {variacaoSelecionada ? (
                          <p className="table-inline-note">
                            Saldo disponível: {saldoDisponivel}
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
                        disabled={itensBloqueados || pedidoBloqueado}
                        required
                      />
                      {possuiSaldoInsuficiente ? (
                        <p className="alert-error" style={{ marginTop: "8px" }}>
                          Quantidade acima do estoque disponível para finalizar.
                        </p>
                      ) : null}
                    </div>
                    <div>
                      <label className="form-label">Preço unitário</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.preco_unitario}
                        onChange={(event) =>
                          atualizarItem(item.localId, "preco_unitario", event.target.value)
                        }
                        disabled={itensBloqueados || pedidoBloqueado}
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
              disabled={salvando || pedidoBloqueado}
            >
              {salvando ? "Salvando..." : editando ? "Salvar Alterações" : "Salvar Pedido"}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
