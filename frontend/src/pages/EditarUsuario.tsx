import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import AccessNotice from "@/components/feedback/AccessNotice";
import Layout from "@/components/layout/Layout";
import PageHeader from "@/components/layout/PageHeader";
import useAuth from "@/hooks/useAuth";
import { authJsonRequest } from "@/services/api";

export default function EditarUsuario() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    password: "",
    tipo: "funcionario",
  });
  const [administradorPrincipal, setAdministradorPrincipal] = useState(false);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    async function carregarUsuario() {
      try {
        const data = await authJsonRequest(`/usuarios/${id}/`, {}, "Erro ao carregar usuário.");

        setForm({
          username: data.username || "",
          password: "",
          tipo: data.tipo || "funcionario",
        });
        setAdministradorPrincipal(Boolean(data.administrador_principal));
      } catch (error) {
        setErro(error.message || "Erro ao carregar usuário.");
        toast.error(error.message || "Erro ao carregar usuário.");
      }
    }

    if (user?.tipo === "admin") {
      carregarUsuario();
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
      const payload: {
        username: string;
        tipo: string;
        password?: string;
      } = {
        username: form.username,
        tipo: form.tipo,
      };

      if (form.password.trim()) {
        payload.password = form.password;
      }

      await authJsonRequest(
        `/usuarios/${id}/`,
        {
          method: "PUT",
          body: payload,
        },
        "Erro ao atualizar usuário.",
      );

      toast.success("Usuário atualizado com sucesso.");
      navigate("/usuarios");
    } catch (error) {
      setErro(error.message || "Erro ao atualizar usuário.");
      toast.error(error.message || "Erro ao atualizar usuário.");
    } finally {
      setSalvando(false);
    }
  }

  if (user?.tipo !== "admin") {
    return (
      <Layout title="Editar usuário">
        <AccessNotice>Acesso restrito ao administrador.</AccessNotice>
      </Layout>
    );
  }

  return (
    <Layout title="Editar usuário">
      <div className="form-shell" style={{ maxWidth: "760px" }}>
        <PageHeader title="Editar usuário" />

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
              {administradorPrincipal ? (
                <input value="Administrador principal" readOnly />
              ) : (
                <select name="tipo" value={form.tipo} onChange={handleChange}>
                  <option value="funcionario">Funcionário</option>
                  <option value="admin">Administrador</option>
                </select>
              )}
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label className="form-label">Nova senha</label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
              />
            </div>
          </div>

          {administradorPrincipal ? (
            <p className="form-helper-text">
              O administrador principal deve ser transferido pelo comando de manutenção.
            </p>
          ) : null}

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
