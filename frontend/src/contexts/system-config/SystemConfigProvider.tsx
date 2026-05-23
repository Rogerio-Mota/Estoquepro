import { useEffect, useState } from "react";

import SystemConfigContext from "@/contexts/system-config/context";
import {
  applyThemeVariables,
  DEFAULT_SYSTEM_CONFIG,
  normalizeSystemConfig,
  syncDocumentBranding,
} from "@/utils/branding";

const STORAGE_KEY = "system_config";
const USER_STORAGE_KEY = "user";

function readStoredConfig() {
  if (typeof window === "undefined") {
    return DEFAULT_SYSTEM_CONFIG;
  }

  const rawConfig = window.localStorage.getItem(STORAGE_KEY);
  if (!rawConfig) {
    return DEFAULT_SYSTEM_CONFIG;
  }

  try {
    return normalizeSystemConfig(JSON.parse(rawConfig));
  } catch {
    return DEFAULT_SYSTEM_CONFIG;
  }
}

function writeStoredConfig(config) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(normalizeSystemConfig(config)),
  );
}

function getCurrentUsername() {
  if (typeof window === "undefined") {
    return null;
  }

  const rawUser = window.localStorage.getItem(USER_STORAGE_KEY);
  if (!rawUser) {
    return null;
  }

  try {
    const parsedUser = JSON.parse(rawUser);
    return parsedUser?.username || null;
  } catch {
    return null;
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Não foi possível ler a logo informada."));
    reader.readAsDataURL(file);
  });
}

async function normalizePayloadToConfig(payload, currentConfig) {
  if (!(payload instanceof FormData)) {
    return normalizeSystemConfig({
      ...currentConfig,
      ...payload,
    });
  }

  const removeLogo = String(payload.get("remover_logo") || "").toLowerCase() === "true";
  const logoFile = payload.get("logo");
  let logoUrl = currentConfig.logo_url;

  if (removeLogo) {
    logoUrl = null;
  } else if (logoFile instanceof Blob && logoFile.size > 0) {
    logoUrl = await readFileAsDataUrl(logoFile);
  }

  return normalizeSystemConfig({
    ...currentConfig,
    nome_empresa: payload.get("nome_empresa"),
    descricao_empresa: payload.get("descricao_empresa"),
    cor_primaria: payload.get("cor_primaria"),
    cor_secundaria: payload.get("cor_secundaria"),
    cor_acento: payload.get("cor_acento"),
    logo_url: logoUrl,
    atualizado_em: new Date().toISOString(),
    atualizado_por_username: getCurrentUsername(),
  });
}

export function SystemConfigProvider({ children }) {
  const [config, setConfigState] = useState(() => readStoredConfig());

  useEffect(() => {
    applyThemeVariables(config);
    syncDocumentBranding(config);
    writeStoredConfig(config);
  }, [config]);

  function setConfig(nextConfig) {
    setConfigState((currentConfig) => {
      const resolvedConfig =
        typeof nextConfig === "function" ? nextConfig(currentConfig) : nextConfig;
      return normalizeSystemConfig(resolvedConfig);
    });
  }

  async function refreshConfig() {
    const storedConfig = readStoredConfig();
    setConfigState(storedConfig);
    return storedConfig;
  }

  async function updateConfig(payload) {
    const nextConfig = await normalizePayloadToConfig(payload, config);
    setConfigState(nextConfig);
    return nextConfig;
  }

  const value = {
    config,
    loading: false,
    refreshConfig,
    updateConfig,
    setConfig,
  };

  return (
    <SystemConfigContext.Provider value={value}>
      {children}
    </SystemConfigContext.Provider>
  );
}
