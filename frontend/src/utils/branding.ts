export const DEFAULT_SYSTEM_CONFIG = {
  nome_empresa: "EstoquePro",
  descricao_empresa: "Sistema simples de controle de estoque",
  logo_url: null,
};

type SystemConfig = typeof DEFAULT_SYSTEM_CONFIG;

export function normalizeSystemConfig(config: Partial<SystemConfig> = {}) {
  return {
    nome_empresa:
      String(config.nome_empresa || DEFAULT_SYSTEM_CONFIG.nome_empresa).trim() ||
      DEFAULT_SYSTEM_CONFIG.nome_empresa,
    descricao_empresa:
      String(
        config.descricao_empresa || DEFAULT_SYSTEM_CONFIG.descricao_empresa,
      ).trim() || DEFAULT_SYSTEM_CONFIG.descricao_empresa,
    logo_url: null,
  };
}

export function applyThemeVariables(_config: SystemConfig = DEFAULT_SYSTEM_CONFIG) {
  return undefined;
}

export function syncDocumentBranding(config: SystemConfig = DEFAULT_SYSTEM_CONFIG) {
  if (typeof document !== "undefined") {
    document.title = config.nome_empresa;
  }
}

export function getBrandInitials(nomeEmpresa = DEFAULT_SYSTEM_CONFIG.nome_empresa) {
  const words = String(nomeEmpresa)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return "EP";
  }

  return words
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}
