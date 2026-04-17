import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import AccessNotice from "../components/AccessNotice";
import Layout from "../components/Layout";
import PageHeader from "../components/PageHeader";
import {
  CATEGORY_OPTIONS,
  getSubcategoryOptions,
} from "../constants/productOptions";
import useAuth from "../hooks/useAuth";
import { authJsonRequest, extractCollection } from "../services/api";


export default function EditarProduto() {
  const { user } = useAuth();
  const { id } = useParams();
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
  });

  useEffect(() => {
    async function carregarDados() {
      try {
        const [produtoData, fornecedoresData] = await Promise.all([
          authJsonRequest(`/produtos/${id}/`, {}, "Erro ao carregar produto."),
          authJsonRequest("/fornecedores/", {}, "Erro ao carregar fornecedores."),
        ]);

        setForm({
          nome: produtoData.nome || "",
          marca: produtoData.marca || "",
          categoria: produtoData.categoria || "",
          subcategoria: produtoData.subcategoria || "",
          sku: produtoData.sku || "",
          preco_custo: produtoData.preco_custo || "",
          preco_venda: produtoData.preco_venda || "",
          estoque_minimo: produtoData.estoque_minimo || "",
          fornecedor: produtoData.fornecedor || "",
        });
        setFornecedores(extractCollection(fornecedoresData));
      } catch (error) {
        setErro(error.message || "Erro ao carregar produto.");
        toast.error(error.message || "Erro ao carregar produto.");
      }
    }

    if (user?.tipo === "admin") {
      carregarDados();
    }
  }, [id, user]);

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

    try {
      await authJsonRequest(
        `/produtos/${id}/`,
        {
          method: "PUT",
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
        "Erro ao editar produto.",
      );

      toast.success("Produto atualizado com sucesso.");
      navigate("/produtos");
    } catch (error) {
      setErro(error.message || "Erro ao editar produto.");
      toast.error(error.message || "Erro ao editar produto.");
    } finally {
      setSalvando(false);
    }
  }

  if (user?.tipo !== "admin") {
    return (
      <Layout title="Editar Produto">
        <AccessNotice>Acesso restrito ao administrador.</AccessNotice>
      </Layout>
    );
  }

  return (
    <Layout title="Editar Produto">
      <div className="form-shell">
        <PageHeader
          title="Editar produto"
          description="Atualize as informações principais, os preços e a configuração do item selecionado."
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

          <div className="form-actions">
            <button
              type="button"
              className="button-secondary"
              onClick={() => navigate("/produtos")}
            >
              Cancelar
            </button>
            <button type="submit" className="button-primary" disabled={salvando}>
              {salvando ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
