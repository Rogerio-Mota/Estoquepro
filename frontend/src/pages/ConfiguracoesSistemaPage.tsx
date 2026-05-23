import { useEffect, useState } from "react";
import { toast } from "react-toastify";

import AccessNotice from "@/components/feedback/AccessNotice";
import Layout from "@/components/layout/Layout";
import PageHeader from "@/components/layout/PageHeader";
import useAuth from "@/hooks/useAuth";
import useSystemConfig from "@/hooks/useSystemConfig";
import { formatDateTime } from "@/utils/formatters";
import {
  DEFAULT_SYSTEM_CONFIG,
  extractPaletteFromImage,
  getBrandInitials,
  normalizeSystemConfig,
} from "@/utils/branding";

function buildPreviewConfig(form, config, logoPreview, removerLogo) {
  return normalizeSystemConfig({
    ...config,
    ...form,
    logo_url: removerLogo ? null : logoPreview || config.logo_url,
  });
}

export default function ConfiguracoesSistemaPage() {
  const { user } = useAuth();
  const { config, updateConfig } = useSystemConfig();
  const [form, setForm] = useState(() => normalizeSystemConfig(config));
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(config.logo_url || null);
  const [removerLogo, setRemoverLogo] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [gerandoPaleta, setGerandoPaleta] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const nextForm = normalizeSystemConfig(config);
    setForm(nextForm);
    setLogoFile(null);
    setLogoPreview(nextForm.logo_url || null);
    setRemoverLogo(false);
  }, [config]);

  useEffect(() => {
    if (!(logoFile instanceof File)) {
      return undefined;
    }

    const objectUrl = URL.createObjectURL(logoFile);
    setLogoPreview(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [logoFile]);

  function atualizarCampo(name, value) {
    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  function handleInputChange(event) {
    const { name, value } = event.target;
    atualizarCampo(name, value);
  }

  function handleLogoChange(event) {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    setLogoFile(selectedFile);
    setRemoverLogo(false);
    setErro("");
  }

  function restaurarAtual() {
    const nextForm = normalizeSystemConfig(config);
    setForm(nextForm);
    setLogoFile(null);
    setLogoPreview(nextForm.logo_url || null);
    setRemoverLogo(false);
    setErro("");
  }

  function restaurarPadrao() {
    const defaultConfig = normalizeSystemConfig(DEFAULT_SYSTEM_CONFIG);
    setForm(defaultConfig);
    setLogoFile(null);
    setLogoPreview(null);
    setRemoverLogo(true);
    setErro("");
    toast.info("Preview restaurado para o padrão. Salve para aplicar.");
  }

  function removerLogoAtual() {
    setLogoFile(null);
    setLogoPreview(null);
    setRemoverLogo(true);
  }

  async function gerarPaletaDaLogo() {
    const source = logoFile || logoPreview || config.logo_url;

    if (!source) {
      toast.info("Selecione uma logo para gerar uma paleta automaticamente.");
      return;
    }

    setGerandoPaleta(true);
    setErro("");

    try {
      const palette = await extractPaletteFromImage(source);
      setForm((currentForm) =>
        normalizeSystemConfig({
          ...currentForm,
          ...palette,
        }),
      );
      toast.success("Paleta sugerida com base na logo.");
    } catch (error) {
      const message = error.message || "Não foi possível gerar a paleta da logo.";
      setErro(message);
      toast.error(message);
    } finally {
      setGerandoPaleta(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSalvando(true);
    setErro("");

    const payload = new FormData();
    payload.append("nome_empresa", form.nome_empresa);
    payload.append("descricao_empresa", form.descricao_empresa);
    payload.append("cor_primaria", form.cor_primaria);
    payload.append("cor_secundaria", form.cor_secundaria);
    payload.append("cor_acento", form.cor_acento);

    if (logoFile) {
      payload.append("logo", logoFile);
    }

    if (removerLogo) {
      payload.append("remover_logo", "true");
    }

    try {
      const nextConfig = await updateConfig(payload);
      const normalizedConfig = normalizeSystemConfig(nextConfig);

      setForm(normalizedConfig);
      setLogoFile(null);
      setLogoPreview(normalizedConfig.logo_url || null);
      setRemoverLogo(false);
      toast.success("Configurações visuais atualizadas com sucesso.");
    } catch (error) {
      const message = error.message || "Não foi possível salvar as configurações.";
      setErro(message);
      toast.error(message);
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

  const previewConfig = buildPreviewConfig(form, config, logoPreview, removerLogo);
  const hasLogo = Boolean(previewConfig.logo_url);
  const brandInitials = getBrandInitials(previewConfig.nome_empresa);

  return (
    <Layout title="Configurações">
      <div className="form-shell form-shell--wide">
        <PageHeader
          title="Configurações do sistema"
          description="Organize o nome exibido, a descrição, a logo e a paleta visual usada pelo frontend."
        />

        {erro ? <div className="alert-error">{erro}</div> : null}

        <div className="dashboard-grid settings-grid settings-grid--simple">
          <form className="page-card form-card" onSubmit={handleSubmit}>
            <div className="form-section">
              <h3 className="section-title">Identidade básica</h3>

              <div className="form-grid">
                <div>
                  <label className="form-label">Nome da empresa</label>
                  <input
                    name="nome_empresa"
                    value={form.nome_empresa}
                    onChange={handleInputChange}
                    placeholder="Ex.: EstoquePro"
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Descrição curta</label>
                  <input
                    name="descricao_empresa"
                    value={form.descricao_empresa}
                    onChange={handleInputChange}
                    placeholder="Ex.: Controle simples de estoque"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="highlight-panel settings-logo-preview">
              <div className="section-header-inline">
                <div>
                  <h3 className="section-title">Logo</h3>
                  <p className="section-subtitle">
                    O preview abaixo reflete o que será exibido na barra superior e na tela de login.
                  </p>
                </div>

                <div className="settings-preview__cta">
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={gerarPaletaDaLogo}
                    disabled={gerandoPaleta}
                  >
                    {gerandoPaleta ? "Gerando paleta..." : "Gerar paleta da logo"}
                  </button>

                  <button
                    type="button"
                    className="button-secondary"
                    onClick={removerLogoAtual}
                    disabled={!previewConfig.logo_url && !logoFile}
                  >
                    Remover logo
                  </button>
                </div>
              </div>

              <div className="settings-logo-preview">
                <div className="page-card settings-logo-preview__box settings-logo-preview__box--compact">
                  {hasLogo ? (
                    <img
                      src={previewConfig.logo_url}
                      alt={`Logo de ${previewConfig.nome_empresa}`}
                      className="settings-logo-preview__image"
                    />
                  ) : (
                    <span className="settings-logo-preview__fallback">{brandInitials}</span>
                  )}
                </div>

                <div className="form-grid form-grid--single">
                  <div>
                    <label className="form-label">Arquivo da logo</label>
                    <input type="file" accept="image/*" onChange={handleLogoChange} />
                  </div>
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3 className="section-title">Paleta de cores</h3>

              <div className="settings-status-grid">
                <div className="color-control">
                  <label className="form-label">Cor primária</label>
                  <div className="color-control__inputs">
                    <input
                      type="color"
                      name="cor_primaria"
                      value={form.cor_primaria}
                      onChange={handleInputChange}
                      className="color-control__picker"
                    />
                    <input
                      type="text"
                      name="cor_primaria"
                      value={form.cor_primaria}
                      onChange={handleInputChange}
                      className="color-control__text"
                    />
                  </div>
                </div>

                <div className="color-control">
                  <label className="form-label">Cor secundária</label>
                  <div className="color-control__inputs">
                    <input
                      type="color"
                      name="cor_secundaria"
                      value={form.cor_secundaria}
                      onChange={handleInputChange}
                      className="color-control__picker"
                    />
                    <input
                      type="text"
                      name="cor_secundaria"
                      value={form.cor_secundaria}
                      onChange={handleInputChange}
                      className="color-control__text"
                    />
                  </div>
                </div>

                <div className="color-control">
                  <label className="form-label">Cor de acento</label>
                  <div className="color-control__inputs">
                    <input
                      type="color"
                      name="cor_acento"
                      value={form.cor_acento}
                      onChange={handleInputChange}
                      className="color-control__picker"
                    />
                    <input
                      type="text"
                      name="cor_acento"
                      value={form.cor_acento}
                      onChange={handleInputChange}
                      className="color-control__text"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="settings-status-grid">
              <article className="metric-card">
                <span className="metric-card__label">Última atualização</span>
                <strong className="metric-card__value">
                  {formatDateTime(config.atualizado_em)}
                </strong>
              </article>

              <article className="metric-card">
                <span className="metric-card__label">Atualizado por</span>
                <strong className="metric-card__value">
                  {config.atualizado_por_username || "-"}
                </strong>
              </article>

              <article className="metric-card">
                <span className="metric-card__label">Logo ativa</span>
                <strong className="metric-card__value">
                  {hasLogo ? "Imagem personalizada" : "Monograma padrão"}
                </strong>
              </article>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="button-secondary"
                onClick={restaurarAtual}
              >
                Recarregar atual
              </button>

              <button
                type="button"
                className="button-secondary"
                onClick={restaurarPadrao}
              >
                Restaurar padrão
              </button>

              <button type="submit" className="button-primary" disabled={salvando}>
                {salvando ? "Salvando..." : "Salvar configurações"}
              </button>
            </div>
          </form>

          <aside className="page-card section-card settings-preview settings-preview--simple">
            <div className="settings-preview__brand">
              <div className="settings-preview__brand-mark">
                {hasLogo ? (
                  <img
                    src={previewConfig.logo_url}
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
              <div className="settings-preview__palette-item">
                <span
                  className="settings-preview__swatch"
                  style={{ background: previewConfig.cor_primaria }}
                />
                <div>
                  <strong>Primária</strong>
                  <p>{previewConfig.cor_primaria}</p>
                </div>
              </div>

              <div className="settings-preview__palette-item">
                <span
                  className="settings-preview__swatch"
                  style={{ background: previewConfig.cor_secundaria }}
                />
                <div>
                  <strong>Secundária</strong>
                  <p>{previewConfig.cor_secundaria}</p>
                </div>
              </div>

              <div className="settings-preview__palette-item">
                <span
                  className="settings-preview__swatch"
                  style={{ background: previewConfig.cor_acento }}
                />
                <div>
                  <strong>Acento</strong>
                  <p>{previewConfig.cor_acento}</p>
                </div>
              </div>
            </div>

            <div className="settings-preview__cards">
              <article className="info-card">
                <span className="info-card__label">Resultado esperado</span>
                <strong className="info-card__value">Branding mais consistente</strong>
                <p className="table-cell-meta">
                  A alteração aplica nome, favicon, cores e identidade da interface neste navegador.
                </p>
              </article>

              <article className="info-card">
                <span className="info-card__label">Escopo atual</span>
                <strong className="info-card__value">Persistência local</strong>
                <p className="table-cell-meta">
                  Essas configurações ficam salvas no `localStorage` e servem como base visual do frontend.
                </p>
              </article>
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
}
