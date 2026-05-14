import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import AccessNotice from "@/components/feedback/AccessNotice";
import Layout from "@/components/layout/Layout";
import PageHeader from "@/components/layout/PageHeader";
import useAuth from "@/hooks/useAuth";
import { authJsonRequest } from "@/services/api";

export default function EditarFornecedor() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nome: "",
    contato: "",
    cidade: "",
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
          contato: data.contato || "",
          cidade: data.cidade || "",
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
        <PageHeader title="Editar fornecedor" />

        {erro ? <div className="alert-error">{erro}</div> : null}

        <form className="page-card form-card" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div>
              <label className="form-label">Nome</label>
              <input
                name="nome"
                value={form.nome}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="form-label">Contato</label>
              <input
                name="contato"
                value={form.contato}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="form-label">Cidade</label>
              <input
                name="cidade"
                value={form.cidade}
                onChange={handleChange}
                required
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
              {salvando ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
