import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import EmptyState from "@/components/feedback/EmptyState";
import Layout from "@/components/layout/Layout";
import PageHeader from "@/components/layout/PageHeader";
import { authJsonRequest, extractCollection } from "@/services/api";

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

function buildVariacaoOptionLabel(variacao) {
  return [
    variacao.produto_nome,
    variacao.cor,
    variacao.tamanho ? `Tam. ${variacao.tamanho}` : null,
    variacao.numeracao ? `Num. ${variacao.numeracao}` : null,
    `Saldo ${variacao.saldo_atual}`,
  ]
    .filter(Boolean)
    .join(" | ");
}

function buildVariacaoResumo(variacao) {
  if (!variacao) {
    return "Selecione uma variação para conferir os detalhes.";
  }

  return [
    variacao.cor ? `Cor ${variacao.cor}` : null,
    variacao.tamanho ? `Tamanho ${variacao.tamanho}` : null,
    variacao.numeracao ? `Numeração ${variacao.numeracao}` : null,
  ]
    .filter(Boolean)
    .join(" | ") || "Variação sem cor, tamanho ou numeração complementar.";
}

export default function NovaMovimentacao() {
  const navigate = useNavigate();
  const [variacoes, setVariacoes] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({
    variacao: "",
    tipo: "",
    quantidade: "",
    fornecedor: "",
    data_referencia: getTodayDate(),
    observacao: "",
  });

  useEffect(() => {
    async function carregarDados() {
      try {
        const [variacoesData, fornecedoresData] = await Promise.all([
          authJsonRequest("/variacoes/", {}, "Erro ao carregar variações."),
          authJsonRequest("/fornecedores/", {}, "Erro ao carregar fornecedores."),
        ]);
        setVariacoes(extractCollection(variacoesData));
        setFornecedores(extractCollection(fornecedoresData));
      } catch (error) {
        setErro(error.message);
        toast.error(error.message);
      }
    }

    carregarDados();
  }, []);

  const variacoesOrdenadas = useMemo(() => {
    return [...variacoes].sort((first, second) =>
      buildVariacaoOptionLabel(first).localeCompare(
        buildVariacaoOptionLabel(second),
        "pt-BR",
      ),
    );
  }, [variacoes]);

  const variacaoSelecionada = useMemo(() => {
    return variacoes.find(
      (variacao) => String(variacao.id) === String(form.variacao),
    ) || null;
  }, [form.variacao, variacoes]);

  const saldoDisponivel = Number(variacaoSelecionada?.saldo_atual || 0);
  const quantidadeInformada = Number(form.quantidade || 0);
  const saidaAcimaSaldo = Boolean(
    form.tipo === "saida" &&
    variacaoSelecionada &&
    quantidadeInformada > saldoDisponivel,
  );

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prevState) => ({
      ...prevState,
      [name]: value,
      ...(name === "tipo" && value !== "entrada"
        ? { fornecedor: "", data_referencia: getTodayDate() }
        : {}),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErro("");
    setSalvando(true);

    const endpoint =
      form.tipo === "entrada" ? "/entrada-estoque/" : "/saida-estoque/";

    try {
      await authJsonRequest(
        endpoint,
        {
          method: "POST",
          body: {
            variacao: Number(form.variacao),
            quantidade: Number(form.quantidade),
            observacao: form.observacao,
            ...(form.tipo === "entrada"
              ? {
                  fornecedor: Number(form.fornecedor),
                  data_referencia: form.data_referencia,
                }
              : {}),
          },
        },
        "Erro ao registrar movimentação.",
      );

      toast.success("Movimentação registrada com sucesso.");
      navigate("/movimentacoes");
    } catch (error) {
      setErro(error.message || "Erro ao registrar movimentação.");
      toast.error(error.message || "Erro ao registrar movimentação.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Layout title="Nova movimentação">
      <div className="form-shell">
        <PageHeader
          title="Nova movimentação"
          description="Escolha a variação, confira o tamanho ou a numeração e informe a quantidade que realmente será movimentada."
        />

        {erro ? <div className="alert-error">{erro}</div> : null}

        <form className="page-card form-card" onSubmit={handleSubmit}>
          <div className="form-section">
            <h3 className="section-title">Movimentação</h3>
            <div className="form-grid">
              <div style={{ gridColumn: "1 / -1" }}>
                <label className="form-label">Produto / variação</label>
                {variacoes.length === 0 ? (
                  <EmptyState>Nenhuma variação cadastrada.</EmptyState>
                ) : (
                  <select
                    name="variacao"
                    value={form.variacao}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Selecione</option>
                    {variacoesOrdenadas.map((variacao) => (
                      <option key={variacao.id} value={variacao.id}>
                        {buildVariacaoOptionLabel(variacao)}
                      </option>
                    ))}
                  </select>
                )}
                <p className="form-helper-text movement-select-note">
                  Escolha a variação exata do produto para revisar cor, tamanho,
                  numeração e saldo antes de lançar a movimentação.
                </p>
              </div>

              {variacaoSelecionada ? (
                <div className="movement-preview-grid" style={{ gridColumn: "1 / -1" }}>
                  <article className="movement-preview-card">
                    <span className="movement-preview-card__label">Produto</span>
                    <strong className="movement-preview-card__value">
                      {variacaoSelecionada.produto_nome}
                    </strong>
                    <p className="table-cell-meta">
                      SKU {variacaoSelecionada.produto_sku || "-"}
                    </p>
                  </article>

                  <article className="movement-preview-card">
                    <span className="movement-preview-card__label">
                      Tamanho / numeração
                    </span>
                    <strong className="movement-preview-card__value">
                      {variacaoSelecionada.tamanho || variacaoSelecionada.numeracao
                        ? [
                            variacaoSelecionada.tamanho
                              ? `Tam. ${variacaoSelecionada.tamanho}`
                              : null,
                            variacaoSelecionada.numeracao
                              ? `Num. ${variacaoSelecionada.numeracao}`
                              : null,
                          ]
                            .filter(Boolean)
                            .join(" | ")
                        : "Sem grade complementar"}
                    </strong>
                    <p className="table-cell-meta">
                      {buildVariacaoResumo(variacaoSelecionada)}
                    </p>
                  </article>

                  <article className="movement-preview-card">
                    <span className="movement-preview-card__label">Saldo atual</span>
                    <strong className="movement-preview-card__value">
                      {saldoDisponivel} unidade(s)
                    </strong>
                    <p className="table-cell-meta">
                      {form.tipo === "saida"
                        ? "Use esse valor para evitar retirar mais itens do que o disponível."
                        : "Referência rápida para comparar a movimentação com o estoque atual."}
                    </p>
                  </article>
                </div>
              ) : null}

              <div>
                <label className="form-label">Tipo</label>
                <select
                  name="tipo"
                  value={form.tipo}
                  onChange={handleChange}
                  required
                >
                  <option value="">Selecione</option>
                  <option value="entrada">Entrada</option>
                  <option value="saida">Saída</option>
                </select>
              </div>

              <div>
                <label className="form-label">Quantidade de peças</label>
                <input
                  name="quantidade"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  placeholder="Ex.: 12"
                  value={form.quantidade}
                  onChange={handleChange}
                  required
                />
                <p className="form-helper-text">
                  Informe quantas unidades serão {form.tipo === "entrada" ? "adicionadas" : "movimentadas"} nesta operação.
                </p>
                {saidaAcimaSaldo ? (
                  <p className="alert-error sales-inline-error movement-inline-warning">
                    A saída informada está acima do saldo disponível para essa
                    variação.
                  </p>
                ) : null}
              </div>

              {form.tipo === "entrada" ? (
                <>
                  <div>
                    <label className="form-label">Fornecedor</label>
                    <select
                      name="fornecedor"
                      value={form.fornecedor}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Selecione</option>
                      {fornecedores.map((fornecedor) => (
                        <option key={fornecedor.id} value={fornecedor.id}>
                          {fornecedor.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Data</label>
                    <input
                      name="data_referencia"
                      type="date"
                      value={form.data_referencia}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </>
              ) : null}

              <div style={{ gridColumn: "1 / -1" }}>
                <label className="form-label">Observação</label>
                <input
                  name="observacao"
                  placeholder="Observação"
                  value={form.observacao}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="button-secondary"
              onClick={() => navigate("/movimentacoes")}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="button-primary"
              disabled={salvando || saidaAcimaSaldo}
            >
              {salvando ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
