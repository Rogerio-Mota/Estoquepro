import { useEffect, useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import useAuth from "../hooks/useAuth";
import useSystemConfig from "../hooks/useSystemConfig";
import { jsonRequest } from "../services/api";
import { getBrandInitials } from "../utils/branding";

export default function Login() {
  const { login, loading, isAuthenticated } = useAuth();
  const { config } = useSystemConfig();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState("");
  const [primeiroAcessoPendente, setPrimeiroAcessoPendente] = useState(false);
  const [carregandoPrimeiroAcesso, setCarregandoPrimeiroAcesso] = useState(true);
  const brandInitials = getBrandInitials(config.nome_empresa);

  useEffect(() => {
    let ativo = true;

    async function carregarPrimeiroAcesso() {
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
      } catch {
        if (ativo) {
          setPrimeiroAcessoPendente(false);
        }
      } finally {
        if (ativo) {
          setCarregandoPrimeiroAcesso(false);
        }
      }
    }

    carregarPrimeiroAcesso();

    return () => {
      ativo = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");

    const result = await login(username, password);

    if (result.success) {
      navigate("/");
      return;
    }

    setErro(result.message || "Não foi possível entrar.");
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="login-page">
      <div className="login-page__shell">
        <section className="page-card login-card">
          <div className="login-card__hero">
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
                <span className="login-page__eyebrow">Sistema interno</span>
                <h1 className="login-page__brand-name">{config.nome_empresa}</h1>
              </div>
            </div>

            <div className="login-page__intro">
              <h2 className="login-page__title">Entrar</h2>
              <p className="login-page__subtitle">Acesse o sistema da loja.</p>
            </div>
          </div>

          <div className="login-card__body">
            <div className="login-card__header">
              <span className="login-card__eyebrow">Acesso</span>
              <h2>Login</h2>
            </div>

            {erro ? <div className="alert-error">{erro}</div> : null}

            {carregandoPrimeiroAcesso ? (
              <div className="login-card__status">
                <strong>Carregando</strong>
                <p>Verificando o sistema.</p>
              </div>
            ) : primeiroAcessoPendente ? (
              <div className="login-card__form">
                <div className="login-card__status login-card__status--highlight">
                  <strong>Primeiro acesso pendente</strong>
                  <p>Crie o administrador inicial.</p>
                </div>

                <button
                  type="button"
                  className="button-primary"
                  onClick={() => navigate("/primeiro-acesso")}
                >
                  Configurar
                </button>
              </div>
            ) : (
              <form className="login-card__form" onSubmit={handleSubmit}>
                <div className="login-field">
                  <label className="form-label">Usuário</label>
                  <input
                    type="text"
                    placeholder="Usuário"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    autoComplete="username"
                    required
                  />
                </div>

                <div className="login-field">
                  <label className="form-label">Senha</label>
                  <input
                    type="password"
                    placeholder="Senha"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </div>

                <button type="submit" className="button-primary" disabled={loading}>
                  {loading ? "Entrando..." : "Entrar"}
                </button>
              </form>
            )}

            <div className="login-card__footer">
              <span>Sistema interno</span>
              <strong>{config.nome_empresa}</strong>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
