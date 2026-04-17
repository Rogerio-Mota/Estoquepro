import { useEffect, useMemo, useState } from "react";

import SystemConfigContext from "./system-config-context";
import { authJsonRequest, jsonRequest } from "../services/api";
import {
  applyThemeVariables,
  DEFAULT_SYSTEM_CONFIG,
  normalizeSystemConfig,
  syncDocumentBranding,
} from "../utils/branding";


export function SystemConfigProvider({ children }) {
  const [config, setConfig] = useState(DEFAULT_SYSTEM_CONFIG);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    applyThemeVariables(config);
    syncDocumentBranding(config);
  }, [config]);

  useEffect(() => {
    let isMounted = true;

    async function carregarConfiguracao() {
      try {
        const data = await jsonRequest(
          "/configuracao-sistema/",
          {},
          "Erro ao carregar as configurações do sistema.",
        );

        if (!isMounted) {
          return;
        }

        setConfig(normalizeSystemConfig(data));
      } catch {
        if (isMounted) {
          setConfig(DEFAULT_SYSTEM_CONFIG);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    carregarConfiguracao();

    return () => {
      isMounted = false;
    };
  }, []);

  async function refreshConfig() {
    const data = await jsonRequest(
      "/configuracao-sistema/",
      {},
      "Erro ao carregar as configurações do sistema.",
    );
    const normalized = normalizeSystemConfig(data);
    setConfig(normalized);
    return normalized;
  }

  async function updateConfig(payload) {
    const data = await authJsonRequest(
      "/configuracao-sistema/",
      {
        method: "PATCH",
        body: payload,
      },
      "Erro ao atualizar as configurações do sistema.",
    );
    const normalized = normalizeSystemConfig(data);
    setConfig(normalized);
    return normalized;
  }

  const value = useMemo(
    () => ({
      config,
      loading,
      refreshConfig,
      updateConfig,
      setConfig,
    }),
    [config, loading],
  );

  return (
    <SystemConfigContext.Provider value={value}>
      {children}
    </SystemConfigContext.Provider>
  );
}
