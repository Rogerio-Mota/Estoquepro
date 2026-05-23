export const DEFAULT_SYSTEM_CONFIG = {
  nome_empresa: "EstoquePro",
  descricao_empresa: "Sistema simples de controle de estoque",
  logo_url: null,
  cor_primaria: "#1768AC",
  cor_secundaria: "#0F4C81",
  cor_acento: "#F97316",
  atualizado_em: null,
  atualizado_por_username: null,
};

type SystemConfig = typeof DEFAULT_SYSTEM_CONFIG;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeHex(value: string | null | undefined, fallback: string) {
  const safeValue = String(value || "").trim().toUpperCase();

  if (/^#[0-9A-F]{6}$/.test(safeValue)) {
    return safeValue;
  }

  return fallback;
}

function hexToRgb(hex: string) {
  const safeHex = normalizeHex(hex, DEFAULT_SYSTEM_CONFIG.cor_primaria).slice(1);

  return {
    r: Number.parseInt(safeHex.slice(0, 2), 16),
    g: Number.parseInt(safeHex.slice(2, 4), 16),
    b: Number.parseInt(safeHex.slice(4, 6), 16),
  };
}

function rgbToHex({
  r,
  g,
  b,
}: {
  r: number;
  g: number;
  b: number;
}) {
  return `#${[r, g, b]
    .map((channel) => clamp(Math.round(channel), 0, 255).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
}

function mixColors(baseHex: string, targetHex: string, ratio: number) {
  const base = hexToRgb(baseHex);
  const target = hexToRgb(targetHex);
  const safeRatio = clamp(ratio, 0, 1);

  return rgbToHex({
    r: base.r + (target.r - base.r) * safeRatio,
    g: base.g + (target.g - base.g) * safeRatio,
    b: base.b + (target.b - base.b) * safeRatio,
  });
}

function shiftColor(hex: string, amount: number) {
  const color = hexToRgb(hex);
  const shift = clamp(amount, -1, 1);

  return rgbToHex({
    r: color.r + (shift >= 0 ? (255 - color.r) * shift : color.r * shift),
    g: color.g + (shift >= 0 ? (255 - color.g) * shift : color.g * shift),
    b: color.b + (shift >= 0 ? (255 - color.b) * shift : color.b * shift),
  });
}

function rgbaFromHex(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${clamp(alpha, 0, 1)})`;
}

function loadImage(source: string | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    let objectUrl: string | null = null;

    if (typeof source === "string") {
      image.crossOrigin = "anonymous";
    } else {
      objectUrl = URL.createObjectURL(source);
    }

    image.onload = () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      resolve(image);
    };

    image.onerror = () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      reject(new Error("Não foi possível processar a logo enviada."));
    };

    image.src = objectUrl || String(source);
  });
}

export function normalizeSystemConfig(config: Partial<SystemConfig> = {}) {
  return {
    ...DEFAULT_SYSTEM_CONFIG,
    ...config,
    nome_empresa:
      String(config.nome_empresa || DEFAULT_SYSTEM_CONFIG.nome_empresa).trim() ||
      DEFAULT_SYSTEM_CONFIG.nome_empresa,
    descricao_empresa:
      String(
        config.descricao_empresa || DEFAULT_SYSTEM_CONFIG.descricao_empresa,
      ).trim() || DEFAULT_SYSTEM_CONFIG.descricao_empresa,
    logo_url: config.logo_url || null,
    cor_primaria: normalizeHex(
      config.cor_primaria,
      DEFAULT_SYSTEM_CONFIG.cor_primaria,
    ),
    cor_secundaria: normalizeHex(
      config.cor_secundaria,
      DEFAULT_SYSTEM_CONFIG.cor_secundaria,
    ),
    cor_acento: normalizeHex(
      config.cor_acento,
      DEFAULT_SYSTEM_CONFIG.cor_acento,
    ),
    atualizado_em: config.atualizado_em || null,
    atualizado_por_username: config.atualizado_por_username || null,
  };
}

export function getBrandInitials(
  nomeEmpresa = DEFAULT_SYSTEM_CONFIG.nome_empresa,
) {
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

export function buildThemeTokens(config: Partial<SystemConfig> = {}) {
  const normalized = normalizeSystemConfig(config);
  const primary = normalized.cor_primaria;
  const secondary = normalized.cor_secundaria;
  const accent = normalized.cor_acento;

  return {
    "--bg": mixColors(primary, "#F4F7FB", 0.9),
    "--surface": "rgba(255, 255, 255, 0.92)",
    "--surface-soft": mixColors(primary, "#FFFFFF", 0.94),
    "--surface-strong": "#FFFFFF",
    "--primary": primary,
    "--primary-dark": shiftColor(primary, -0.2),
    "--secondary": secondary,
    "--accent": accent,
    "--accent-soft": mixColors(accent, "#FFFFFF", 0.78),
    "--text": mixColors(secondary, "#0F172A", 0.72),
    "--muted": mixColors(secondary, "#7A8CA2", 0.56),
    "--border": rgbaFromHex(mixColors(secondary, "#C7D4E2", 0.55), 0.38),
    "--shadow": `0 24px 48px ${rgbaFromHex(
      mixColors(secondary, "#0F172A", 0.4),
      0.12,
    )}`,
    "--page-glow-top": rgbaFromHex(primary, 0.16),
    "--page-glow-bottom": rgbaFromHex(accent, 0.16),
    "--nav-surface": `linear-gradient(135deg, ${rgbaFromHex(primary, 0.14)}, ${rgbaFromHex(secondary, 0.1)})`,
    "--nav-border": rgbaFromHex(secondary, 0.12),
    "--brand-gradient": `linear-gradient(135deg, ${primary}, ${secondary})`,
    "--hero-gradient": `linear-gradient(160deg, ${mixColors(secondary, "#0F172A", 0.25)} 0%, ${mixColors(primary, "#112133", 0.22)} 100%)`,
    "--hero-glow": rgbaFromHex(accent, 0.24),
    "--primary-soft": mixColors(primary, "#FFFFFF", 0.85),
    "--secondary-soft": mixColors(secondary, "#FFFFFF", 0.86),
    "--table-hover": rgbaFromHex(primary, 0.05),
  };
}

export function applyThemeVariables(config: Partial<SystemConfig> = {}) {
  if (typeof document === "undefined") {
    return;
  }

  const rootStyle = document.documentElement.style;
  const tokens = buildThemeTokens(config);

  Object.entries(tokens).forEach(([token, value]) => {
    rootStyle.setProperty(token, value);
  });
}

function buildFallbackFavicon(config: Partial<SystemConfig>) {
  const normalized = normalizeSystemConfig(config);
  const initials = getBrandInitials(normalized.nome_empresa);
  const primary = normalized.cor_primaria;
  const secondary = normalized.cor_secundaria;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <defs>
        <linearGradient id="brand" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${primary}" />
          <stop offset="100%" stop-color="${secondary}" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill="url(#brand)" />
      <text
        x="32"
        y="37"
        text-anchor="middle"
        font-family="Segoe UI, Arial, sans-serif"
        font-size="24"
        font-weight="700"
        fill="#FFFFFF"
      >
        ${initials}
      </text>
    </svg>
  `;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function ensureFaviconElement() {
  let favicon = document.querySelector<HTMLLinkElement>("link[rel='icon']");

  if (!favicon) {
    favicon = document.createElement("link");
    favicon.rel = "icon";
    document.head.appendChild(favicon);
  }

  return favicon;
}

export function syncDocumentBranding(config: Partial<SystemConfig> = {}) {
  if (typeof document === "undefined") {
    return;
  }

  const normalized = normalizeSystemConfig(config);
  document.title = normalized.nome_empresa;

  const favicon = ensureFaviconElement();
  favicon.href = normalized.logo_url || buildFallbackFavicon(normalized);
}

export async function extractPaletteFromImage(source: string | Blob) {
  const image = await loadImage(source);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context) {
    throw new Error("Não foi possível ler a imagem da logo.");
  }

  const maxDimension = 96;
  const scale = Math.min(maxDimension / image.width, maxDimension / image.height, 1);
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));

  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const { data } = context.getImageData(0, 0, canvas.width, canvas.height);

  let totalAlpha = 0;
  let totalR = 0;
  let totalG = 0;
  let totalB = 0;

  for (let index = 0; index < data.length; index += 4) {
    const alpha = data[index + 3];
    if (alpha < 40) {
      continue;
    }

    totalAlpha += alpha;
    totalR += data[index] * alpha;
    totalG += data[index + 1] * alpha;
    totalB += data[index + 2] * alpha;
  }

  if (!totalAlpha) {
    return {
      cor_primaria: DEFAULT_SYSTEM_CONFIG.cor_primaria,
      cor_secundaria: DEFAULT_SYSTEM_CONFIG.cor_secundaria,
      cor_acento: DEFAULT_SYSTEM_CONFIG.cor_acento,
    };
  }

  const primary = rgbToHex({
    r: totalR / totalAlpha,
    g: totalG / totalAlpha,
    b: totalB / totalAlpha,
  });
  const secondary = shiftColor(primary, -0.24);
  const accent = mixColors(DEFAULT_SYSTEM_CONFIG.cor_acento, primary, 0.32);

  return {
    cor_primaria: primary,
    cor_secundaria: secondary,
    cor_acento: accent,
  };
}
