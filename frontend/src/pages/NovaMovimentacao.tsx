import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import EmptyState from "../components/EmptyState";
import Layout from "../components/Layout";
import PageHeader from "../components/PageHeader";
import { authJsonRequest, extractCollection } from "../services/api";


export default function NovaMovimentacao() {
  const navigate = useNavigate();
  const [variacoes, setVariacoes] = useState([]);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({
    variacao: "",
    tipo: "",
    quantidade: "",
    observacao: "",
  });

  useEffect(() => {
    async function carregarVariacoes() {
      try {
        const data = await authJsonRequest("/variacoes/", {}, "Erro ao carregar variações.");
        setVariacoes(extractCollection(data));
      } catch (error) {
        setErro(error.message);
        toast.error(error.message);
      }
    }

    carregarVariacoes();
  }, []);

  const variacaoSelecionada = useMemo(
    () => variacoes.find((variacao) => String(variacao.id) === String(form.variacao)),
    [form.variacao, variacoes],
  );

  function handleChange(event) {
    setForm((prevState) => ({
      ...prevState,
      [event.target.name]: event.target.value,
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
    <Layout title="Ajuste Manual">
      <div className="form-shell">
        <PageHeader
          title="Ajuste manual de estoque"
          description="Use apenas para correções. Entradas por NF-e e saídas por pedido finalizado acontecem automaticamente."
        />

        {erro ? <div className="alert-error">{erro}</div> : null}

        <form className="page-card form-card" onSubmit={handleSubmit}>
          <div className="form-section">
            <h3 className="section-title">Dados do ajuste</h3>
            <div className="form-grid">
              <div style={{ gridColumn: "1 / -1" }}>
                <label className="form-label">Variação</label>
                {variacoes.length === 0 ? (
                  <EmptyState>Nenhuma variação cadastrada para movimentar.</EmptyState>
                ) : (
                  <select
                    name="variacao"
                    value={form.variacao}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Selecione a variação</option>
                    {variacoes.map((variacao) => (
                      <option key={variacao.id} value={variacao.id}>
                        {variacao.produto_nome} | Cor: {variacao.cor || "-"} | Tam: {variacao.tamanho || "-"} | Num: {variacao.numeracao || "-"} | Saldo: {variacao.saldo_atual}
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
                  <option value="">Selecione o tipo</option>
                  <option value="entrada">Entrada manual</option>
                  <option value="saida">Saída manual</option>
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

              <div style={{ gridColumn: "1 / -1" }}>
                <label className="form-label">Observação</label>
                <input
                  name="observacao"
                  placeholder="Ex.: reposição de estoque, venda no caixa..."
                  value={form.observacao}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {variacaoSelecionada ? (
            <div className="highlight-panel">
              <h3 className="section-title">Resumo da variação selecionada</h3>
              <div className="info-grid">
                <div className="info-card">
                  <span className="info-card__label">Produto</span>
                  <strong className="info-card__value">
                    {variacaoSelecionada.produto_nome}
                  </strong>
                </div>
                <div className="info-card">
                  <span className="info-card__label">Cor</span>
                  <strong className="info-card__value">
                    {variacaoSelecionada.cor || "-"}
                  </strong>
                </div>
                <div className="info-card">
                  <span className="info-card__label">Tamanho</span>
                  <strong className="info-card__value">
                    {variacaoSelecionada.tamanho || "-"}
                  </strong>
                </div>
                <div className="info-card">
                  <span className="info-card__label">Numeração</span>
                  <strong className="info-card__value">
                    {variacaoSelecionada.numeracao || "-"}
                  </strong>
                </div>
                <div className="info-card">
                  <span className="info-card__label">Saldo atual</span>
                  <strong className="info-card__value">
                    {variacaoSelecionada.saldo_atual}
                  </strong>
                </div>
              </div>
            </div>
          ) : null}

          <div className="form-actions">
            <button
              type="button"
              className="button-secondary"
              onClick={() => navigate("/movimentacoes")}
            >
              Cancelar
            </button>
            <button type="submit" className="button-primary" disabled={salvando}>
              {salvando ? "Salvando..." : "Salvar Ajuste"}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
