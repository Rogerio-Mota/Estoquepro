import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import useAuth from "@/hooks/useAuth";
import useSystemConfig from "@/hooks/useSystemConfig";
import { jsonRequest } from "@/services/api";
import { getBrandInitials } from "@/utils/branding";

type PrimeiroAcessoFormState = {
  username: string;
  password: string;
  password_confirmacao: string;
};

const INITIAL_PRIMEIRO_ACESSO_FORM: PrimeiroAcessoFormState = {
  username: "",
  password: "",
  password_confirmacao: "",
};

export default function Login() {
  const { login, loading, isAuthenticated } = useAuth();
  const { config } = useSystemConfig();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState("");
  const [primeiroAcessoPendente, setPrimeiroAcessoPendente] = useState(false);
  const [primeiroAcessoPublicoHabilitado, setPrimeiroAcessoPublicoHabilitado] =
    useState(false);
  const [carregandoPrimeiroAcesso, setCarregandoPrimeiroAcesso] = useState(true);
  const [salvandoPrimeiroAcesso, setSalvandoPrimeiroAcesso] = useState(false);
  const [formPrimeiroAcesso, setFormPrimeiroAcesso] = useState(
    INITIAL_PRIMEIRO_ACESSO_FORM,
  );
  const brandInitials = getBrandInitials(config.nome_empresa);
  const mostrarFormularioPrimeiroAcesso =
    primeiroAcessoPendente && primeiroAcessoPublicoHabilitado;
  const mostrarAvisoProvisionamento =
    primeiroAcessoPendente && !primeiroAcessoPublicoHabilitado;

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
        setPrimeiroAcessoPublicoHabilitado(
          Boolean(data.primeiro_acesso_publico_habilitado),
        );
      } catch {
        if (ativo) {
          setPrimeiroAcessoPendente(false);
          setPrimeiroAcessoPublicoHabilitado(false);
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

    setErro(result.message || "Nao foi possivel entrar.");
  }

  function handlePrimeiroAcessoChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;

    setFormPrimeiroAcesso((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  }

  async function handlePrimeiroAcessoSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");
    setSalvandoPrimeiroAcesso(true);

    try {
      await jsonRequest(
        "/primeiro-acesso/",
        {
          method: "POST",
          body: formPrimeiroAcesso,
        },
        "Erro ao criar o administrador inicial.",
      );

      const loginResult = await login(
        formPrimeiroAcesso.username,
        formPrimeiroAcesso.password,
      );

      if (loginResult.success) {
        toast.success("Administrador inicial criado com sucesso.");
        navigate("/");
        return;
      }

      setPrimeiroAcessoPendente(false);
      setUsername(formPrimeiroAcesso.username);
      setPassword(formPrimeiroAcesso.password);
      setFormPrimeiroAcesso(INITIAL_PRIMEIRO_ACESSO_FORM);
      setErro(loginResult.message || "Administrador criado. Faca o login para continuar.");
      toast.success("Administrador criado. Entre com a nova conta para continuar.");
    } catch (error) {
      const message = error.message || "Erro ao criar o administrador inicial.";
      setErro(message);
      toast.error(message);
    } finally {
      setSalvandoPrimeiroAcesso(false);
    }
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
              <h2>
                {mostrarFormularioPrimeiroAcesso
                  ? "Administrador inicial"
                  : mostrarAvisoProvisionamento
                    ? "Configuracao inicial"
                    : "Login"}
              </h2>
              <p>
                {mostrarFormularioPrimeiroAcesso
                  ? "Crie o acesso principal para liberar o sistema."
                  : mostrarAvisoProvisionamento
                    ? "Crie o administrador principal pelo backend para liberar o sistema."
                  : "Entre com o usuario cadastrado."}
              </p>
            </div>

            {erro ? <div className="alert-error">{erro}</div> : null}

            {carregandoPrimeiroAcesso ? (
              <div className="login-card__status">
                <strong>Carregando</strong>
                <p>Verificando o sistema.</p>
              </div>
            ) : mostrarFormularioPrimeiroAcesso ? (
              <form className="login-card__form" onSubmit={handlePrimeiroAcessoSubmit}>
                <div className="login-card__status login-card__status--highlight">
                  <strong>Primeiro acesso pendente</strong>
                  <p>Crie o administrador inicial para liberar os demais logins.</p>
                </div>

                <div className="login-field">
                  <label className="form-label">Usuario</label>
                  <input
                    name="username"
                    type="text"
                    placeholder="admin"
                    value={formPrimeiroAcesso.username}
                    onChange={handlePrimeiroAcessoChange}
                    autoComplete="username"
                    required
                  />
                </div>

                <div className="login-field">
                  <label className="form-label">Senha</label>
                  <input
                    name="password"
                    type="password"
                    placeholder="Senha"
                    value={formPrimeiroAcesso.password}
                    onChange={handlePrimeiroAcessoChange}
                    autoComplete="new-password"
                    required
                  />
                </div>

                <div className="login-field">
                  <label className="form-label">Confirmar senha</label>
                  <input
                    name="password_confirmacao"
                    type="password"
                    placeholder="Repita a senha"
                    value={formPrimeiroAcesso.password_confirmacao}
                    onChange={handlePrimeiroAcessoChange}
                    autoComplete="new-password"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="button-primary"
                  disabled={salvandoPrimeiroAcesso || loading}
                >
                  {salvandoPrimeiroAcesso || loading
                    ? "Configurando..."
                    : "Criar administrador"}
                </button>
              </form>
            ) : mostrarAvisoProvisionamento ? (
              <div className="login-card__form">
                <div className="login-card__status login-card__status--highlight">
                  <strong>Nenhum administrador principal configurado</strong>
                  <p>
                    No backend, execute{" "}
                    <code>python manage.py configurar_admin_principal --username seu_admin</code>{" "}
                    e informe a senha quando o terminal solicitar.
                  </p>
                  <p>Depois volte para esta tela e faca login com a conta criada.</p>
                </div>
              </div>
            ) : (
              <form className="login-card__form" onSubmit={handleSubmit}>
                <div className="login-field">
                  <label className="form-label">Usuario</label>
                  <input
                    type="text"
                    placeholder="Usuario"
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
