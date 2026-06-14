import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import AccessNotice from "@/components/feedback/AccessNotice";
import Layout from "@/components/layout/Layout";
import PageHeader from "@/components/layout/PageHeader";
import useAuth from "@/hooks/useAuth";
import { authJsonRequest } from "@/services/api";
import { formatPhoneInput, PHONE_INPUT_MAX_LENGTH } from "@/utils/phone";

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
          contato: formatPhoneInput(data.contato || ""),
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
    const nextValue =
      event.target.name === "contato"
        ? formatPhoneInput(event.target.value)
        : event.target.value;

    setForm((prevState) => ({
      ...prevState,
      [event.target.name]: nextValue,
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
                type="tel"
                inputMode="numeric"
                placeholder="(99) 99999-9999"
                maxLength={PHONE_INPUT_MAX_LENGTH}
                value={form.contato}
                onChange={handleChange}
                required
              />
              <p className="form-helper-text">
                Use o formato `(99) 99999-9999`.
              </p>
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
