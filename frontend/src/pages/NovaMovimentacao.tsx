import { useEffect, useState } from "react";
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
        <PageHeader title="Nova movimentação" />

        {erro ? <div className="alert-error">{erro}</div> : null}

        <form className="page-card form-card" onSubmit={handleSubmit}>
          <div className="form-section">
            <h3 className="section-title">Movimentação</h3>
            <div className="form-grid">
              <div style={{ gridColumn: "1 / -1" }}>
                <label className="form-label">Variação</label>
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
                    {variacoes.map((variacao) => (
                      <option key={variacao.id} value={variacao.id}>
                        {buildVariacaoOptionLabel(variacao)}
                      </option>
                    ))}
                  </select>
                )}
              </div>

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
                <label className="form-label">Quantidade</label>
                <input
                  name="quantidade"
                  type="number"
                  min="1"
                  value={form.quantidade}
                  onChange={handleChange}
                  required
                />
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
            <button type="submit" className="button-primary" disabled={salvando}>
              {salvando ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
