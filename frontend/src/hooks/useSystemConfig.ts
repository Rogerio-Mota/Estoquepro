import { useContext } from "react";

import SystemConfigContext from "../context/system-config-context";


export default function useSystemConfig() {
  const context = useContext(SystemConfigContext);

  if (!context) {
    throw new Error("useSystemConfig deve ser usado dentro de SystemConfigProvider.");
  }

  return context;
}
