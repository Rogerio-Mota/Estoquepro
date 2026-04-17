import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import useAuth from "../hooks/useAuth";
import useSystemConfig from "../hooks/useSystemConfig";
import { jsonRequest } from "../services/api";
import { getBrandInitials } from "../utils/branding";


export default function PrimeiroAcessoPage() {
  const { login, loading, isAuthenticated } = useAuth();
  const { config } = useSystemConfig();
  const navigate = useNavigate();
  const [erro, setErro] = useState("");
  const [verificando, setVerificando] = useState(true);
  const [primeiroAcessoPendente, setPrimeiroAcessoPendente] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState({
    username: "",
    password: "",
    password_confirmacao: "",
  });
  const brandInitials = getBrandInitials(config.nome_empresa);

  useEffect(() => {
    let ativo = true;

    async function carregarStatus() {
      try {
        const data = await jsonRequest(
          "/primeiro-acesso/",
          {},
          "Erro ao verificar o primeiro acesso.",
        );

        if (!ativo) {
          return;
        }

        setPrimeiroAcessoPendente(Boolean(data.primeiro_acesso_pendente));
      } catch (error) {
        if (ativo) {
          setErro(error.message || "Erro ao verificar o primeiro acesso.");
        }
      } finally {
        if (ativo) {
          setVerificando(false);
        }
      }
    }

    carregarStatus();

    return () => {
      ativo = false;
    };
  }, []);

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
      await jsonRequest(
        "/primeiro-acesso/",
        {
          method: "POST",
          body: form,
        },
        "Erro ao criar o administrador inicial.",
      );

      const loginResult = await login(form.username, form.password);
      if (loginResult.success) {
        toast.success("Administrador inicial criado com sucesso.");
        navigate("/");
        return;
      }

      toast.success("Administrador inicial criado com sucesso.");
      navigate("/login");
    } catch (error) {
      setErro(error.message || "Erro ao criar o administrador inicial.");
      toast.error(error.message || "Erro ao criar o administrador inicial.");
    } finally {
      setSalvando(false);
    }
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (!verificando && !primeiroAcessoPendente) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="login-page">
      <section className="login-page__hero">
        <div className="login-page__hero-box">
          <div className="login-page__brand">
            <div className="login-page__logo">
              {config.logo_url ? (
                <img
                  src={config.logo_url}
                  alt={`Logo de ${config.nome_empresa}`}
                  className="login-page__logo-image"
                />
              ) : (
                brandInitials
              )}
            </div>

            <div>
              <span className="login-page__eyebrow">Primeira configuração</span>
              <h1 className="login-page__title">{config.nome_empresa}</h1>
            </div>
          </div>
          <p className="login-page__subtitle">
            Configure o primeiro administrador para liberar o acesso do cliente
            final e iniciar a operação com segurança.
          </p>
        </div>
      </section>

      <section className="login-page__panel">
        <div className="page-card login-card">
          <div className="login-card__header">
            <h2>Administrador inicial</h2>
            <p>Esse acesso terá permissão para configurar usuários e o sistema.</p>
          </div>

          {erro ? <div className="alert-error">{erro}</div> : null}

          {verificando ? (
            <p className="login-card__footer">Verificando status do sistema...</p>
          ) : (
            <form className="login-card__form" onSubmit={handleSubmit}>
              <div>
                <label className="form-label">Usuário administrador</label>
                <input
                  name="username"
                  placeholder="Ex.: admin"
                  value={form.username}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="form-label">Senha</label>
                <input
                  name="password"
                  type="password"
                  placeholder="Crie uma senha segura"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="form-label">Confirmar senha</label>
                <input
                  name="password_confirmacao"
                  type="password"
                  placeholder="Repita a senha"
                  value={form.password_confirmacao}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="highlight-panel" style={{ marginBottom: 0 }}>
                <p className="table-inline-note">
                  Depois dessa etapa, os próximos administradores poderão ser
                  criados pela própria tela de usuários.
                </p>
              </div>

              <div className="form-actions" style={{ justifyContent: "stretch" }}>
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => navigate("/login")}
                  disabled={salvando || loading}
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  className="button-primary"
                  disabled={salvando || loading}
                >
                  {salvando || loading ? "Configurando..." : "Criar administrador"}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
