import { useEffect, useState } from "react";
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

  async function handleSubmit(event) {
    event.preventDefault();
    setErro("");

    const result = await login(username, password);

    if (result.success) {
      navigate("/");
      return;
    }

    setErro(result.message || "Não foi possível entrar no sistema.");
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
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
              <span className="login-page__eyebrow">Acesso interno</span>
              <h1 className="login-page__title">{config.nome_empresa}</h1>
            </div>
          </div>
          <p className="login-page__subtitle">
            {config.descricao_empresa}. Entre para continuar a operação com uma
            interface mais direta e organizada.
          </p>
        </div>
      </section>

      <section className="login-page__panel">
        <div className="page-card login-card">
          <div className="login-card__header">
            <h2>Entrar no sistema</h2>
            <p>Acesse sua conta para continuar.</p>
          </div>

          {erro ? <div className="alert-error">{erro}</div> : null}

          {carregandoPrimeiroAcesso ? (
            <p className="login-card__footer">Verificando acesso inicial...</p>
          ) : primeiroAcessoPendente ? (
            <div className="login-card__form">
              <div className="highlight-panel" style={{ marginBottom: 0 }}>
                <h3 className="section-title">Primeiro acesso</h3>
                <p className="table-inline-note">
                  Nenhum administrador foi configurado ainda. Conclua a criação do
                  primeiro login para liberar o sistema.
                </p>
              </div>

              <button
                type="button"
                className="button-primary"
                onClick={() => navigate("/primeiro-acesso")}
              >
                Configurar administrador inicial
              </button>
            </div>
          ) : (
            <form className="login-card__form" onSubmit={handleSubmit}>
              <div>
                <label className="form-label">Usuário</label>
                <input
                  type="text"
                  placeholder="Digite seu usuário"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  required
                />
              </div>

              <div>
                <label className="form-label">Senha</label>
                <input
                  type="password"
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>

              <button type="submit" className="button-primary" disabled={loading}>
                {loading ? "Entrando..." : "Entrar"}
              </button>
            </form>
          )}

          <p className="login-card__footer">
            Painel interno de gestão de estoque de {config.nome_empresa}
          </p>
        </div>
      </section>
    </div>
  );
}
