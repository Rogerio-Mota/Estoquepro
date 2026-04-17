import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import AccessNotice from "../components/AccessNotice";
import Layout from "../components/Layout";
import PageHeader from "../components/PageHeader";
import useAuth from "../hooks/useAuth";
import { authJsonRequest } from "../services/api";


export default function NovoFornecedor() {
  const { user } = useAuth();
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
        "/fornecedores/",
        {
          method: "POST",
          body: form,
        },
        "Erro ao cadastrar fornecedor.",
      );

      toast.success("Fornecedor cadastrado com sucesso.");
      navigate("/fornecedores");
    } catch (error) {
      setErro(error.message || "Erro ao cadastrar fornecedor.");
      toast.error(error.message || "Erro ao cadastrar fornecedor.");
    } finally {
      setSalvando(false);
    }
  }

  if (user?.tipo !== "admin") {
    return (
      <Layout title="Novo Fornecedor">
        <AccessNotice>Acesso restrito ao administrador.</AccessNotice>
      </Layout>
    );
  }

  return (
    <Layout title="Novo Fornecedor">
      <div className="form-shell" style={{ maxWidth: "760px" }}>
        <PageHeader
          title="Cadastrar fornecedor"
          description="Registre um novo parceiro comercial com os dados principais de contato."
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
              {salvando ? "Salvando..." : "Salvar Fornecedor"}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
