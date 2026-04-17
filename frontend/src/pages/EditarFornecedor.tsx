import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import AccessNotice from "../components/AccessNotice";
import Layout from "../components/Layout";
import PageHeader from "../components/PageHeader";
import useAuth from "../hooks/useAuth";
import { authJsonRequest } from "../services/api";


export default function EditarFornecedor() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nome: "",
    documento: "",
    contato: "",
    telefone: "",
    email: "",
  });
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    async function carregarFornecedor() {
      try {
        const data = await authJsonRequest(
          `/fornecedores/${id}/`,
          {},
          "Erro ao carregar fornecedor.",
        );

        setForm({
          nome: data.nome || "",
          documento: data.documento || "",
          contato: data.contato || "",
          telefone: data.telefone || "",
          email: data.email || "",
        });
      } catch (error) {
        setErro(error.message || "Erro ao carregar fornecedor.");
        toast.error(error.message || "Erro ao carregar fornecedor.");
      }
    }

    if (user?.tipo === "admin") {
      carregarFornecedor();
    }
  }, [id, user]);

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

    try {
      await authJsonRequest(
        `/fornecedores/${id}/`,
        {
          method: "PUT",
          body: form,
        },
        "Erro ao editar fornecedor.",
      );

      toast.success("Fornecedor atualizado com sucesso.");
      navigate("/fornecedores");
    } catch (error) {
      setErro(error.message || "Erro ao editar fornecedor.");
      toast.error(error.message || "Erro ao editar fornecedor.");
    } finally {
      setSalvando(false);
    }
  }

  if (user?.tipo !== "admin") {
    return (
      <Layout title="Editar Fornecedor">
        <AccessNotice>Acesso restrito ao administrador.</AccessNotice>
      </Layout>
    );
  }

  return (
    <Layout title="Editar Fornecedor">
      <div className="form-shell" style={{ maxWidth: "760px" }}>
        <PageHeader
          title="Editar fornecedor"
          description="Atualize os dados comerciais e de contato do parceiro selecionado."
        />

        {erro ? <div className="alert-error">{erro}</div> : null}

        <form className="page-card form-card" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div>
              <label className="form-label">Nome</label>
              <input
                name="nome"
                placeholder="Nome do fornecedor"
                value={form.nome}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="form-label">Documento</label>
              <input
                name="documento"
                placeholder="CPF ou CNPJ"
                value={form.documento}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="form-label">Contato</label>
              <input
                name="contato"
                placeholder="Pessoa ou setor responsável"
                value={form.contato}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="form-label">Telefone</label>
              <input
                name="telefone"
                placeholder="Telefone"
                value={form.telefone}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="form-label">Email</label>
              <input
                name="email"
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="button-secondary"
              onClick={() => navigate("/fornecedores")}
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
