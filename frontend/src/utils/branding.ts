const DEFAULT_THEME = {
  nome_empresa: "EstoquePro",
  descricao_empresa: "Gestão inteligente de estoque",
  logo_url: null,
  cor_primaria: "#1768AC",
  cor_secundaria: "#0F4C81",
  cor_acento: "#F97316",
};


function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeHex(value, fallback) {
  const rawValue = (value || "").trim().toUpperCase();
  if (/^#[0-9A-F]{6}$/.test(rawValue)) {
    return rawValue;
  }

  return fallback;
}

function hexToRgb(hex) {
  const safeHex = normalizeHex(hex, DEFAULT_THEME.cor_primaria).slice(1);
  return {
    r: Number.parseInt(safeHex.slice(0, 2), 16),
    g: Number.parseInt(safeHex.slice(2, 4), 16),
    b: Number.parseInt(safeHex.slice(4, 6), 16),
  };
}

function rgbToHex({ r, g, b }) {
  return `#${[r, g, b]
    .map((channel) => clamp(Math.round(channel), 0, 255).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
}

function mixColors(baseHex, targetHex, ratio) {
  const base = hexToRgb(baseHex);
  const target = hexToRgb(targetHex);
  const safeRatio = clamp(ratio, 0, 1);

  return rgbToHex({
    r: base.r + (target.r - base.r) * safeRatio,
    g: base.g + (target.g - base.g) * safeRatio,
    b: base.b + (target.b - base.b) * safeRatio,
  });
}

function shiftColor(hex, amount) {
  const color = hexToRgb(hex);
  const shift = clamp(amount, -1, 1);

  return rgbToHex({
    r: color.r + (shift >= 0 ? (255 - color.r) * shift : color.r * shift),
    g: color.g + (shift >= 0 ? (255 - color.g) * shift : color.g * shift),
    b: color.b + (shift >= 0 ? (255 - color.b) * shift : color.b * shift),
  });
}

function rgbaFromHex(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${clamp(alpha, 0, 1)})`;
}

function rgbToHsl({ r, g, b }) {
  const nr = r / 255;
  const ng = g / 255;
  const nb = b / 255;
  const max = Math.max(nr, ng, nb);
  const min = Math.min(nr, ng, nb);
  const delta = max - min;

  let hue = 0;
  if (delta !== 0) {
    if (max === nr) {
      hue = ((ng - nb) / delta) % 6;
    } else if (max === ng) {
      hue = (nb - nr) / delta + 2;
    } else {
      hue = (nr - ng) / delta + 4;
    }
  }

  const lightness = (max + min) / 2;
  const saturation =
    delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));

  return {
    h: Math.round(hue * 60 < 0 ? hue * 60 + 360 : hue * 60),
    s: saturation,
    l: lightness,
  };
}

function getColorDistance(firstHex, secondHex) {
  const first = hexToRgb(firstHex);
  const second = hexToRgb(secondHex);

  return Math.sqrt(
    (first.r - second.r) ** 2 +
      (first.g - second.g) ** 2 +
      (first.b - second.b) ** 2,
  );
}

function quantizeChannel(value) {
  return clamp(Math.round(value / 24) * 24, 0, 255);
}

function loadImage(source: string | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    let objectUrl = null;

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

    image.src = objectUrl || source;
  });
}

function chooseDistinctColor(candidates, baseColors, fallback) {
  return (
    candidates.find((candidate) =>
      baseColors.every((baseColor) => getColorDistance(candidate.hex, baseColor) > 78),
    )?.hex || fallback
  );
}

export function getBrandInitials(name?: string | null) {
  const parts = (name || DEFAULT_THEME.nome_empresa)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return "EP";
  }

  return parts.map((part) => part[0]).join("").toUpperCase();
}

export function normalizeSystemConfig(config: any = {}) {
  return {
    ...DEFAULT_THEME,
    ...config,
    nome_empresa: (config.nome_empresa || DEFAULT_THEME.nome_empresa).trim(),
    descricao_empresa: (
      config.descricao_empresa || DEFAULT_THEME.descricao_empresa
    ).trim(),
    logo_url: config.logo_url || null,
    cor_primaria: normalizeHex(config.cor_primaria, DEFAULT_THEME.cor_primaria),
    cor_secundaria: normalizeHex(config.cor_secundaria, DEFAULT_THEME.cor_secundaria),
    cor_acento: normalizeHex(config.cor_acento, DEFAULT_THEME.cor_acento),
  };
}

export function buildThemeTokens(config: any = {}) {
  const normalized = normalizeSystemConfig(config);
  const primary = normalized.cor_primaria;
  const secondary = normalized.cor_secundaria;
  const accent = normalized.cor_acento;
  const text = mixColors(secondary, "#0F172A", 0.72);
  const muted = mixColors(secondary, "#7A8CA2", 0.56);

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
    "--text": text,
    "--muted": muted,
    "--border": rgbaFromHex(mixColors(secondary, "#C7D4E2", 0.55), 0.38),
    "--shadow": `0 24px 48px ${rgbaFromHex(mixColors(secondary, "#0F172A", 0.4), 0.12)}`,
    "--page-glow-top": rgbaFromHex(primary, 0.16),
    "--page-glow-bottom": rgbaFromHex(accent, 0.16),
    "--nav-surface": `linear-gradient(135deg, ${rgbaFromHex(primary, 0.14)}, ${rgbaFromHex(secondary, 0.1)})`,
    "--nav-border": rgbaFromHex(secondary, 0.12),
    "--brand-gradient": `linear-gradient(135deg, ${primary}, ${secondary})`,
    "--hero-gradient": `linear-gradient(160deg, ${mixColors(
      secondary,
      "#0F172A",
      0.25,
    )} 0%, ${mixColors(primary, "#112133", 0.22)} 100%)`,
    "--hero-glow": rgbaFromHex(accent, 0.24),
    "--primary-soft": mixColors(primary, "#FFFFFF", 0.85),
    "--secondary-soft": mixColors(secondary, "#FFFFFF", 0.86),
    "--table-hover": rgbaFromHex(primary, 0.05),
  };
}

function getLinearChannel(value) {
  const normalized = value / 255;
  if (normalized <= 0.03928) {
    return normalized / 12.92;
  }

  return ((normalized + 0.055) / 1.055) ** 2.4;
}

function getRelativeLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  return (
    0.2126 * getLinearChannel(r) +
    0.7152 * getLinearChannel(g) +
    0.0722 * getLinearChannel(b)
  );
}

export function getContrastRatio(firstHex, secondHex) {
  const luminanceOne = getRelativeLuminance(firstHex);
  const luminanceTwo = getRelativeLuminance(secondHex);
  const lighter = Math.max(luminanceOne, luminanceTwo);
  const darker = Math.min(luminanceOne, luminanceTwo);

  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

export function getContrastQualityLabel(ratio) {
  if (ratio >= 4.5) {
    return "Excelente";
  }

  if (ratio >= 3) {
    return "Boa";
  }

  return "Ajuste recomendado";
}

export function applyThemeVariables(config: any = {}) {
  if (typeof document === "undefined") {
    return;
  }

  const rootStyle = document.documentElement.style;
  const tokens = buildThemeTokens(config);

  Object.entries(tokens).forEach(([token, value]) => {
    rootStyle.setProperty(token, value);
  });
}

function buildFallbackFavicon(config: any) {
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

function ensureFaviconElement(): HTMLLinkElement {
  let favicon = document.querySelector<HTMLLinkElement>("link[rel='icon']");

  if (!favicon) {
    favicon = document.createElement("link");
    favicon.rel = "icon";
    document.head.appendChild(favicon);
  }

  return favicon;
}

export function syncDocumentBranding(config: any = {}) {
  if (typeof document === "undefined") {
    return;
  }

  const normalized = normalizeSystemConfig(config);
  document.title = `${normalized.nome_empresa} | Gestão de estoque`;
  document.documentElement.lang = "pt-BR";

  const favicon = ensureFaviconElement();
  const version = normalized.atualizado_em
    ? `${normalized.logo_url?.includes("?") ? "&" : "?"}v=${encodeURIComponent(
        normalized.atualizado_em,
      )}`
    : "";
  favicon.href = normalized.logo_url
    ? `${normalized.logo_url}${version}`
    : buildFallbackFavicon(normalized);
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
  const buckets = new Map<string, { score: number; saturation: number }>();

  for (let index = 0; index < data.length; index += 4) {
    const alpha = data[index + 3];
    if (alpha < 120) {
      continue;
    }

    const rawColor = {
      r: data[index],
      g: data[index + 1],
      b: data[index + 2],
    };
    const hsl = rgbToHsl(rawColor);

    if (hsl.l > 0.97) {
      continue;
    }

    if (hsl.l < 0.06 && hsl.s < 0.22) {
      continue;
    }

    const quantized = {
      r: quantizeChannel(rawColor.r),
      g: quantizeChannel(rawColor.g),
      b: quantizeChannel(rawColor.b),
    };
    const hex = rgbToHex(quantized);
    const score = 1 + hsl.s * 1.8 + (0.5 - Math.abs(hsl.l - 0.5));
    const current = buckets.get(hex) || { score: 0, saturation: hsl.s };

    buckets.set(hex, {
      score: current.score + score,
      saturation: Math.max(current.saturation, hsl.s),
    });
  }

  const ordered = [...buckets.entries()]
    .map(([hex, meta]) => ({
      hex,
      score: meta.score,
      saturation: meta.saturation,
    }))
    .sort((first, second) => second.score - first.score);

  if (ordered.length === 0) {
    return {
      cor_primaria: DEFAULT_THEME.cor_primaria,
      cor_secundaria: DEFAULT_THEME.cor_secundaria,
      cor_acento: DEFAULT_THEME.cor_acento,
    };
  }

  const primary = ordered[0].hex;
  const secondary = chooseDistinctColor(
    ordered,
    [primary],
    shiftColor(primary, -0.2),
  );
  const accentCandidates = [...ordered].sort((first, second) => {
    if (second.saturation !== first.saturation) {
      return second.saturation - first.saturation;
    }

    return second.score - first.score;
  });
  const accent = chooseDistinctColor(
    accentCandidates,
    [primary, secondary],
    mixColors(primary, DEFAULT_THEME.cor_acento, 0.35),
  );

  return {
    cor_primaria: primary,
    cor_secundaria: secondary,
    cor_acento: accent,
  };
}

export { DEFAULT_THEME as DEFAULT_SYSTEM_CONFIG };
