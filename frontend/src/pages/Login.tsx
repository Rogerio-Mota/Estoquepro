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

    setErro(result.message || "Não foi possível entrar no sistema.");
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
                <span className="login-page__eyebrow">Ambiente interno</span>
                <h1 className="login-page__brand-name">{config.nome_empresa}</h1>
              </div>
            </div>

            <div className="login-page__intro">
              <h2 className="login-page__title">Acesso ao painel da loja.</h2>
              <p className="login-page__subtitle">
                {config.descricao_empresa}. Entre para continuar a operação com um
                ambiente interno mais claro e organizado.
              </p>
            </div>
          </div>

          <div className="login-card__body">
            <div className="login-card__header">
              <span className="login-card__eyebrow">Acesso</span>
              <h2>Bem-vindo de volta</h2>
              <p>Use seu usuário e senha para continuar no painel de gestão.</p>
            </div>

            {erro ? <div className="alert-error">{erro}</div> : null}

            {carregandoPrimeiroAcesso ? (
              <div className="login-card__status">
                <strong>Preparando o acesso</strong>
                <p>Estamos verificando se a configuração inicial já foi concluída.</p>
              </div>
            ) : primeiroAcessoPendente ? (
              <div className="login-card__form">
                <div className="login-card__status login-card__status--highlight">
                  <strong>Primeiro acesso pendente</strong>
                  <p>
                    Nenhum administrador foi configurado ainda. Conclua a criação
                    do primeiro login para liberar o sistema.
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
                <div className="login-field">
                  <label className="form-label">Usuário</label>
                  <input
                    type="text"
                    placeholder="Digite seu usuário"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    autoComplete="username"
                    required
                  />
                  <p className="login-field__hint">
                    Use o mesmo identificador cadastrado para a sua equipe.
                  </p>
                </div>

                <div className="login-field">
                  <label className="form-label">Senha</label>
                  <input
                    type="password"
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <p className="login-field__hint">
                    Seus dados são conferidos antes de liberar o painel.
                  </p>
                </div>

                <button type="submit" className="button-primary" disabled={loading}>
                  {loading ? "Entrando..." : "Entrar no painel"}
                </button>
              </form>
            )}

            <div className="login-card__footer">
              <span>Painel interno de gestão de estoque</span>
              <strong>{config.nome_empresa}</strong>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
