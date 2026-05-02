import { useEffect, useMemo, useState } from "react";

import SystemConfigContext from "./system-config-context";
import {
  applyThemeVariables,
  DEFAULT_SYSTEM_CONFIG,
  syncDocumentBranding,
} from "../utils/branding";


export function SystemConfigProvider({ children }) {
  const [config, setConfig] = useState(DEFAULT_SYSTEM_CONFIG);

  useEffect(() => {
    applyThemeVariables(config);
    syncDocumentBranding(config);
  }, [config]);

  const value = useMemo(
    () => ({
      config,
      loading: false,
      refreshConfig: async () => config,
      updateConfig: async () => config,
      setConfig,
    }),
    [config],
  );

  return (
    <SystemConfigContext.Provider value={value}>
      {children}
    </SystemConfigContext.Provider>
  );
}
