import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import AccessNotice from "../components/AccessNotice";
import Layout from "../components/Layout";
import PageHeader from "../components/PageHeader";
import useAuth from "../hooks/useAuth";
import { authJsonRequest } from "../services/api";

export default function NovoUsuario() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    password: "",
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
        "/usuarios/",
        {
          method: "POST",
          body: {
            ...form,
            tipo: "funcionario",
          },
        },
        "Erro ao cadastrar usuário.",
      );

      toast.success("Usuário cadastrado com sucesso.");
      navigate("/usuarios");
    } catch (error) {
      setErro(error.message || "Erro ao cadastrar usuário.");
      toast.error(error.message || "Erro ao cadastrar usuário.");
    } finally {
      setSalvando(false);
    }
  }

  if (user?.tipo !== "admin") {
    return (
      <Layout title="Novo usuário">
        <AccessNotice>Acesso restrito ao administrador.</AccessNotice>
      </Layout>
    );
  }

  return (
    <Layout title="Novo usuário">
      <div className="form-shell" style={{ maxWidth: "760px" }}>
        <PageHeader title="Novo usuário" />

        {erro ? <div className="alert-error">{erro}</div> : null}

        <form className="page-card form-card" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div>
              <label className="form-label">Usuário</label>
              <input
                name="username"
                value={form.username}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="form-label">Perfil</label>
              <input value="Funcionário" readOnly />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label className="form-label">Senha</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="button-secondary"
              onClick={() => navigate("/usuarios")}
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
