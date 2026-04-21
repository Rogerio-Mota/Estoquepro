import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

import AccessNotice from "../components/AccessNotice";
import Layout from "../components/Layout";
import PageHeader from "../components/PageHeader";
import useAuth from "../hooks/useAuth";
import useSystemConfig from "../hooks/useSystemConfig";
import {
  applyThemeVariables,
  DEFAULT_SYSTEM_CONFIG,
  extractPaletteFromImage,
  getBrandInitials,
  normalizeSystemConfig,
} from "../utils/branding";
import { formatDateTime } from "../utils/formatters";

function buildFormFromConfig(config) {
  return {
    nome_empresa: config.nome_empresa || "",
    descricao_empresa: config.descricao_empresa || "",
    cor_primaria: config.cor_primaria || "#1768AC",
    cor_secundaria: config.cor_secundaria || "#0F4C81",
    cor_acento: config.cor_acento || "#F97316",
    remover_logo: false,
  };
}

function revokePreview(url) {
  if (url?.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}

export default function ConfiguracoesSistemaPage() {
  const { user } = useAuth();
  const { config, updateConfig } = useSystemConfig();
  const [form, setForm] = useState(() => buildFormFromConfig(config));
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [analisandoLogo, setAnalisandoLogo] = useState(false);

  useEffect(() => {
    setForm(buildFormFromConfig(config));
    setLogoFile(null);
    setLogoPreview((previous) => {
      revokePreview(previous);
      return null;
    });
  }, [config]);

  useEffect(() => () => revokePreview(logoPreview), [logoPreview]);

  const logoAtual = logoPreview || (form.remover_logo ? null : config.logo_url);
  const logoSourceForPalette = logoFile || logoAtual;
  const previewConfig = useMemo(
    () =>
      normalizeSystemConfig({
        ...config,
        ...form,
        logo_url: logoAtual,
      }),
    [config, form, logoAtual],
  );
  const brandInitials = getBrandInitials(previewConfig.nome_empresa);
  const hasUnsavedChanges = useMemo(() => {
    return (
      form.nome_empresa.trim() !== config.nome_empresa ||
      form.descricao_empresa.trim() !== config.descricao_empresa ||
      form.cor_primaria.trim().toUpperCase() !== config.cor_primaria ||
      form.cor_secundaria.trim().toUpperCase() !== config.cor_secundaria ||
      form.cor_acento.trim().toUpperCase() !== config.cor_acento ||
      Boolean(logoFile) ||
      (form.remover_logo && Boolean(config.logo_url))
    );
  }, [config, form, logoFile]);

  useEffect(() => {
    applyThemeVariables(previewConfig);

    return () => {
      applyThemeVariables(config);
    };
  }, [previewConfig, config]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((prevState) => ({
      ...prevState,
      [name]: name.startsWith("cor_") ? value.toUpperCase() : value,
    }));
  }

  async function applyPaletteFromCurrentLogo(source, successMessage) {
    if (!source) {
      toast.info("Envie uma logo antes de gerar a paleta automaticamente.");
      return;
    }

    setErro("");
    setAnalisandoLogo(true);

    try {
      const paleta = await extractPaletteFromImage(source);
      setForm((prevState) => ({
        ...prevState,
        ...paleta,
        remover_logo: false,
      }));
      toast.success(successMessage);
    } catch (error) {
      toast.error(error.message || "Não foi possível identificar a paleta da logo.");
    } finally {
      setAnalisandoLogo(false);
    }
  }

  async function handleLogoChange(event) {
    const arquivo = event.target.files?.[0];

    if (!arquivo) {
      return;
    }

    revokePreview(logoPreview);

    const previewUrl = URL.createObjectURL(arquivo);
    setLogoPreview(previewUrl);
    setLogoFile(arquivo);
    setForm((prevState) => ({
      ...prevState,
      remover_logo: false,
    }));

    await applyPaletteFromCurrentLogo(
      arquivo,
      "Paleta aplicada com base na nova logo.",
    );
  }

  function handleRemoveLogo() {
    revokePreview(logoPreview);
    setLogoPreview(null);
    setLogoFile(null);
    setForm((prevState) => ({
      ...prevState,
      remover_logo: true,
    }));
  }

  function handleResetForm() {
    revokePreview(logoPreview);
    setLogoPreview(null);
    setLogoFile(null);
    setErro("");
    setForm(buildFormFromConfig(config));
  }

  function handleRestoreDefaults() {
    revokePreview(logoPreview);
    setLogoPreview(null);
    setLogoFile(null);
    setErro("");
    setForm({
      ...buildFormFromConfig(DEFAULT_SYSTEM_CONFIG),
      remover_logo: true,
    });
    toast.info("Tema padrão carregado para revisão.");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErro("");
    setSalvando(true);

    const payload = new FormData();
    payload.append("nome_empresa", form.nome_empresa.trim());
    payload.append("descricao_empresa", form.descricao_empresa.trim());
    payload.append("cor_primaria", form.cor_primaria.trim().toUpperCase());
    payload.append("cor_secundaria", form.cor_secundaria.trim().toUpperCase());
    payload.append("cor_acento", form.cor_acento.trim().toUpperCase());

    if (logoFile) {
      payload.append("logo", logoFile);
    }

    if (form.remover_logo) {
      payload.append("remover_logo", "true");
    }

    try {
      const updatedConfig = await updateConfig(payload);
      setForm(buildFormFromConfig(updatedConfig));
      setLogoFile(null);
      revokePreview(logoPreview);
      setLogoPreview(null);
      toast.success("Configurações atualizadas com sucesso.");
    } catch (error) {
      setErro(error.message || "Erro ao atualizar as configurações.");
      toast.error(error.message || "Erro ao atualizar as configurações.");
    } finally {
      setSalvando(false);
    }
  }

  if (user?.tipo !== "admin") {
    return (
      <Layout title="Configurações">
        <AccessNotice>Acesso restrito ao administrador.</AccessNotice>
      </Layout>
    );
  }

  return (
    <Layout title="Configurações">
      <div className="form-shell form-shell--wide">
        <PageHeader
          title="Configurações do sistema"
          description="Defina nome, logo e cores principais do sistema de forma simples."
          action={
            <div className="table-actions">
              <button
                type="button"
                className="button-secondary"
                onClick={handleRestoreDefaults}
              >
                Tema padrão
              </button>
              {hasUnsavedChanges ? (
                <button
                  type="button"
                  className="button-secondary"
                  onClick={handleResetForm}
                >
                  Descartar
                </button>
              ) : null}
            </div>
          }
        />

        {erro ? <div className="alert-error">{erro}</div> : null}

        <div className="dashboard-grid settings-grid settings-grid--simple">
          <form className="page-card form-card" onSubmit={handleSubmit}>
            <div className="form-section">
              <h3 className="section-title">Informações básicas</h3>
              <div className="form-grid">
                <div>
                  <label className="form-label">Nome da empresa</label>
                  <input
                    name="nome_empresa"
                    value={form.nome_empresa}
                    onChange={handleChange}
                    placeholder="Ex.: Minha Empresa"
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Descrição curta</label>
                  <input
                    name="descricao_empresa"
                    value={form.descricao_empresa}
                    onChange={handleChange}
                    placeholder="Ex.: Gestão inteligente de estoque"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="highlight-panel">
              <h3 className="section-title">Logo</h3>
              <div className="form-grid">
                <div>
                  <label className="form-label">Arquivo da logo</label>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    onChange={handleLogoChange}
                  />
                  <p className="table-inline-note">
                    Ao enviar a logo, o sistema tenta aplicar automaticamente a paleta principal.
                  </p>
                </div>

                <div className="settings-logo-preview">
                  <span className="form-label">Visual atual</span>
                  <div className="settings-logo-preview__box settings-logo-preview__box--compact">
                    {logoAtual ? (
                      <img
                        src={logoAtual}
                        alt={`Logo de ${previewConfig.nome_empresa}`}
                        className="settings-logo-preview__image"
                      />
                    ) : (
                      <span className="settings-logo-preview__fallback">
                        {brandInitials}
                      </span>
                    )}
                  </div>

                  <div className="table-actions">
                    <button
                      type="button"
                      className="button-secondary"
                      onClick={() =>
                        applyPaletteFromCurrentLogo(
                          logoSourceForPalette,
                          "Paleta reaplicada com sucesso.",
                        )
                      }
                      disabled={!logoSourceForPalette || analisandoLogo}
                    >
                      Reaplicar paleta
                    </button>
                    <button
                      type="button"
                      className="button-secondary"
                      onClick={handleRemoveLogo}
                      disabled={!logoAtual && !logoFile && !config.logo_url}
                    >
                      Remover logo
                    </button>
                  </div>
                </div>
              </div>

              {analisandoLogo ? (
                <p className="table-inline-note">
                  Analisando a logo para montar a paleta visual...
                </p>
              ) : null}
            </div>

            <div className="form-section">
              <h3 className="section-title">Cores principais</h3>
              <div className="form-grid">
                {[
                  ["cor_primaria", "Cor primária"],
                  ["cor_secundaria", "Cor secundária"],
                  ["cor_acento", "Cor de acento"],
                ].map(([fieldName, label]) => (
                  <div key={fieldName} className="color-control">
                    <label className="form-label">{label}</label>
                    <div className="color-control__inputs">
                      <input
                        type="color"
                        name={fieldName}
                        value={form[fieldName]}
                        onChange={handleChange}
                        className="color-control__picker"
                      />
                      <input
                        type="text"
                        name={fieldName}
                        value={form[fieldName]}
                        onChange={handleChange}
                        placeholder="#000000"
                        maxLength={7}
                        className="color-control__text"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="button-secondary"
                onClick={handleResetForm}
                disabled={!hasUnsavedChanges}
              >
                Voltar ao salvo
              </button>
              <button type="submit" className="button-primary" disabled={salvando}>
                {salvando ? "Salvando..." : "Salvar configurações"}
              </button>
            </div>
          </form>

          <aside className="page-card section-card settings-preview settings-preview--simple">
            <h3 className="section-title">Preview</h3>
            <p className="section-subtitle">
              Veja como a marca aparece no sistema antes de salvar.
            </p>

            <div className="settings-preview__brand">
              <div className="settings-preview__brand-mark settings-preview__brand-mark--simple">
                {logoAtual ? (
                  <img
                    src={logoAtual}
                    alt={`Logo de ${previewConfig.nome_empresa}`}
                    className="settings-preview__brand-image"
                  />
                ) : (
                  <span>{brandInitials}</span>
                )}
              </div>
              <div>
                <strong className="settings-preview__brand-title">
                  {previewConfig.nome_empresa}
                </strong>
                <p className="settings-preview__brand-subtitle settings-preview__brand-subtitle--dark">
                  {previewConfig.descricao_empresa}
                </p>
              </div>
            </div>

            <div className="settings-preview__palette settings-preview__palette--simple">
              {[form.cor_primaria, form.cor_secundaria, form.cor_acento].map((color) => (
                <div key={color} className="settings-preview__palette-item">
                  <span
                    className="settings-preview__swatch"
                    style={{ background: color }}
                  />
                  <strong>{color}</strong>
                </div>
              ))}
            </div>

            <div className="settings-status-grid">
              <div className="metric-card">
                <span className="metric-card__label">Última atualização</span>
                <strong className="metric-card__value settings-metric__value">
                  {formatDateTime(config.atualizado_em)}
                </strong>
              </div>
              <div className="metric-card">
                <span className="metric-card__label">Responsável</span>
                <strong className="metric-card__value settings-metric__value">
                  {config.atualizado_por_username || "Sistema"}
                </strong>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
}
