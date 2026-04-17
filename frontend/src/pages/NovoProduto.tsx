import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import AccessNotice from "../components/AccessNotice";
import Layout from "../components/Layout";
import PageHeader from "../components/PageHeader";
import {
  CATEGORY_OPTIONS,
  NUMBER_OPTIONS,
  SIZE_OPTIONS,
  getSubcategoryOptions,
  usesNumber,
  usesSize,
} from "../constants/productOptions";
import useAuth from "../hooks/useAuth";
import { authFetch, authJsonRequest, extractCollection } from "../services/api";


export default function NovoProduto() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [fornecedores, setFornecedores] = useState([]);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    marca: "",
    categoria: "",
    subcategoria: "",
    sku: "",
    preco_custo: "",
    preco_venda: "",
    estoque_minimo: "",
    fornecedor: "",
    cor: "",
    tamanho: "",
    numeracao: "",
    estoque_inicial: "",
  });

  useEffect(() => {
    async function carregarFornecedores() {
      try {
        const data = await authJsonRequest(
          "/fornecedores/",
          {},
          "Erro ao carregar fornecedores.",
        );
        setFornecedores(extractCollection(data));
      } catch (error) {
        setErro(error.message || "Erro ao carregar fornecedores.");
        toast.error(error.message || "Erro ao carregar fornecedores.");
      }
    }

    if (user?.tipo === "admin") {
      carregarFornecedores();
    }
  }, [user]);

  const subcategoriasDisponiveis = useMemo(
    () => getSubcategoryOptions(form.categoria),
    [form.categoria],
  );

  function handleChange(event) {
    const { name, value } = event.target;

    if (name === "categoria") {
      setForm((prevState) => ({
        ...prevState,
        categoria: value,
        subcategoria: "",
        tamanho: "",
        numeracao: "",
      }));
      return;
    }

    setForm((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErro("");
    setSalvando(true);

    let produtoCriadoId = null;

    try {
      const produto = await authJsonRequest(
        "/produtos/",
        {
          method: "POST",
          body: {
            nome: form.nome,
            marca: form.marca,
            categoria: form.categoria,
            subcategoria: form.subcategoria,
            sku: form.sku,
            preco_custo: form.preco_custo || null,
            preco_venda: form.preco_venda,
            estoque_minimo: Number(form.estoque_minimo || 0),
            fornecedor: form.fornecedor ? Number(form.fornecedor) : null,
          },
        },
        "Erro ao cadastrar produto.",
      );

      produtoCriadoId = produto.id;

      await authJsonRequest(
        "/variacoes/",
        {
          method: "POST",
          body: {
            produto: produto.id,
            cor: form.cor || null,
            tamanho: form.tamanho || null,
            numeracao: form.numeracao || null,
            estoque_inicial: Number(form.estoque_inicial || 0),
          },
        },
        "Produto criado, mas houve erro ao cadastrar a variação inicial.",
      );

      toast.success(
        Number(form.estoque_inicial || 0) > 0
          ? "Produto cadastrado e entrada inicial registrada automaticamente."
          : "Produto cadastrado com sucesso.",
      );
      navigate("/produtos");
    } catch (error) {
      setErro(error.message || "Erro ao cadastrar produto.");
      toast.error(error.message || "Erro ao cadastrar produto.");

      if (produtoCriadoId) {
        await authFetch(`/produtos/${produtoCriadoId}/`, { method: "DELETE" });
      }
    } finally {
      setSalvando(false);
    }
  }

  if (user?.tipo !== "admin") {
    return (
      <Layout title="Novo Produto">
        <AccessNotice>Acesso restrito ao administrador.</AccessNotice>
      </Layout>
    );
  }

  return (
    <Layout title="Novo Produto">
      <div className="form-shell">
        <PageHeader
          title="Cadastrar produto"
          description="Cadastre o produto e, se houver saldo inicial, o sistema registra a entrada automaticamente."
        />

        {erro ? <div className="alert-error">{erro}</div> : null}

        <form className="page-card form-card" onSubmit={handleSubmit}>
          <div className="form-section">
            <h3 className="section-title">Informações principais</h3>
            <div className="form-grid">
              <div>
                <label className="form-label">Nome do produto</label>
                <input
                  name="nome"
                  placeholder="Ex.: Camisa Polo"
                  value={form.nome}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="form-label">Marca</label>
                <input
                  name="marca"
                  placeholder="Ex.: Adidas"
                  value={form.marca}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="form-label">Categoria</label>
                <select
                  name="categoria"
                  value={form.categoria}
                  onChange={handleChange}
                  required
                >
                  <option value="">Selecione a categoria</option>
                  {CATEGORY_OPTIONS.map((categoria) => (
                    <option key={categoria.value} value={categoria.value}>
                      {categoria.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Subcategoria</label>
                <select
                  name="subcategoria"
                  value={form.subcategoria}
                  onChange={handleChange}
                  disabled={!form.categoria}
                  required
                >
                  <option value="">Selecione a subcategoria</option>
                  {subcategoriasDisponiveis.map((subcategoria) => (
                    <option key={subcategoria.value} value={subcategoria.value}>
                      {subcategoria.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">SKU</label>
                <input
                  name="sku"
                  placeholder="Ex.: CAM-001"
                  value={form.sku}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="form-label">Fornecedor</label>
                <select
                  name="fornecedor"
                  value={form.fornecedor}
                  onChange={handleChange}
                >
                  <option value="">Selecione o fornecedor</option>
                  {fornecedores.map((fornecedor) => (
                    <option key={fornecedor.id} value={fornecedor.id}>
                      {fornecedor.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">Preços e controle</h3>
            <div className="form-grid">
              <div>
                <label className="form-label">Preço de custo</label>
                <input
                  name="preco_custo"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={form.preco_custo}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="form-label">Preço de venda</label>
                <input
                  name="preco_venda"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0,00"
                  value={form.preco_venda}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="form-label">Estoque mínimo</label>
                <input
                  name="estoque_minimo"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.estoque_minimo}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="highlight-panel">
            <h3 className="section-title">Primeira variação e entrada inicial</h3>
            <p className="table-inline-note">
              O saldo inicial gera uma entrada automática no histórico do estoque.
            </p>
            <div className="form-grid">
              <div>
                <label className="form-label">Cor</label>
                <input
                  name="cor"
                  placeholder="Ex.: Azul"
                  value={form.cor}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="form-label">Estoque inicial</label>
                <input
                  name="estoque_inicial"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.estoque_inicial}
                  onChange={handleChange}
                />
              </div>
              {usesSize(form.subcategoria) ? (
                <div>
                  <label className="form-label">Tamanho</label>
                  <select
                    name="tamanho"
                    value={form.tamanho}
                    onChange={handleChange}
                    required
                  >
                    {SIZE_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
              {usesNumber(form.subcategoria) ? (
                <div>
                  <label className="form-label">Numeração</label>
                  <select
                    name="numeracao"
                    value={form.numeracao}
                    onChange={handleChange}
                    required
                  >
                    {NUMBER_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="button-secondary"
              onClick={() => navigate("/produtos")}
            >
              Cancelar
            </button>
            <button type="submit" className="button-primary" disabled={salvando}>
              {salvando ? "Salvando..." : "Salvar Produto"}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
