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

type PaletteBucket = {
  pixelCount: number;
  saturationTotal: number;
  lightnessTotal: number;
  hueVectorX: number;
  hueVectorY: number;
  weight: number;
};

type PaletteCandidate = {
  coverage: number;
  hex: string;
  hue: number;
  isNeutral: boolean;
  lightness: number;
  pixelCount: number;
  saturation: number;
  weight: number;
};

function getColorDistance(firstHex, secondHex) {
  const first = hexToRgb(firstHex);
  const second = hexToRgb(secondHex);

  return Math.sqrt(
    (first.r - second.r) ** 2 +
      (first.g - second.g) ** 2 +
      (first.b - second.b) ** 2,
  );
}

function hueToRgbChannel(p, q, t) {
  let safeT = t;

  if (safeT < 0) {
    safeT += 1;
  }

  if (safeT > 1) {
    safeT -= 1;
  }

  if (safeT < 1 / 6) {
    return p + (q - p) * 6 * safeT;
  }

  if (safeT < 1 / 2) {
    return q;
  }

  if (safeT < 2 / 3) {
    return p + (q - p) * (2 / 3 - safeT) * 6;
  }

  return p;
}

function hslToRgb({ h, s, l }) {
  const hue = ((h % 360) + 360) % 360 / 360;
  const saturation = clamp(s, 0, 1);
  const lightness = clamp(l, 0, 1);

  if (saturation === 0) {
    const channel = lightness * 255;

    return {
      r: channel,
      g: channel,
      b: channel,
    };
  }

  const q =
    lightness < 0.5
      ? lightness * (1 + saturation)
      : lightness + saturation - lightness * saturation;
  const p = 2 * lightness - q;

  return {
    r: hueToRgbChannel(p, q, hue + 1 / 3) * 255,
    g: hueToRgbChannel(p, q, hue) * 255,
    b: hueToRgbChannel(p, q, hue - 1 / 3) * 255,
  };
}

function hslToHex(hsl) {
  return rgbToHex(hslToRgb(hsl));
}

function getHueDistance(firstHue, secondHue) {
  const distance = Math.abs(firstHue - secondHue) % 360;
  return Math.min(distance, 360 - distance);
}

function getAverageHue(vectorX, vectorY) {
  if (vectorX === 0 && vectorY === 0) {
    return 0;
  }

  const angle = (Math.atan2(vectorY, vectorX) * 180) / Math.PI;

  return (angle + 360) % 360;
}

function isLikelyNeutralColor({ s, l }) {
  return s < 0.12 || (s < 0.2 && (l < 0.18 || l > 0.82));
}

function isExtremeImageColor({ s, l }) {
  if (l > 0.985) {
    return true;
  }

  if (l < 0.03) {
    return true;
  }

  if (l > 0.95 && s < 0.12) {
    return true;
  }

  if (l < 0.06 && s < 0.16) {
    return true;
  }

  return false;
}

function getPixelPaletteWeight(hsl, alpha) {
  const alphaWeight = clamp(alpha / 255, 0, 1);
  const balance = 1 - Math.min(1, Math.abs(hsl.l - 0.52) / 0.52);
  const saturationBoost = 0.65 + hsl.s * 1.9;
  const balanceBoost = 0.75 + balance * 0.95;
  const neutralFactor = isLikelyNeutralColor(hsl) ? 0.62 : 1;

  return alphaWeight * saturationBoost * balanceBoost * neutralFactor;
}

function quantizeChannel(value) {
  return clamp(Math.round(value / 18) * 18, 0, 255);
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

function hasEnoughPaletteDifference(candidate, baseColors: PaletteCandidate[]) {
  return baseColors.every((baseColor) => {
    return (
      getColorDistance(candidate.hex, baseColor.hex) > 54 ||
      getHueDistance(candidate.hue, baseColor.hue) > 18 ||
      Math.abs(candidate.lightness - baseColor.lightness) > 0.16
    );
  });
}

function selectCandidate(candidates: PaletteCandidate[], getScore, predicate = () => true) {
  let bestCandidate = null;
  let bestScore = Number.NEGATIVE_INFINITY;

  candidates.forEach((candidate) => {
    if (!predicate(candidate)) {
      return;
    }

    const score = getScore(candidate);

    if (score > bestScore) {
      bestScore = score;
      bestCandidate = candidate;
    }
  });

  return bestCandidate;
}

function buildSecondaryFallback(primary: PaletteCandidate) {
  return shiftColor(primary.hex, primary.lightness > 0.54 ? -0.3 : 0.3);
}

function chooseFallbackColor(candidates, baseColors, fallback) {
  return (
    candidates.find((candidate) =>
      baseColors.every((baseColor) => getColorDistance(candidate, baseColor) > 68),
    ) || fallback
  );
}

function buildAccentFallback(primary: PaletteCandidate, secondaryHex: string) {
  const rotatedAccent = hslToHex({
    h: primary.hue + (primary.hue < 180 ? 42 : -42),
    s: clamp(Math.max(primary.saturation, 0.44), 0.4, 0.88),
    l: clamp(primary.lightness < 0.42 ? 0.56 : 0.48, 0.38, 0.64),
  });
  const mixedAccent = mixColors(primary.hex, DEFAULT_THEME.cor_acento, 0.48);

  return chooseFallbackColor(
    [rotatedAccent, mixedAccent],
    [primary.hex, secondaryHex],
    mixedAccent,
  );
}

function createPaletteCandidates(buckets: Map<string, PaletteBucket>) {
  const totalWeight = [...buckets.values()].reduce(
    (accumulator, bucket) => accumulator + bucket.weight,
    0,
  );

  return [...buckets.entries()]
    .map(([hex, bucket]) => ({
      hex,
      coverage: totalWeight > 0 ? bucket.weight / totalWeight : 0,
      hue: getAverageHue(bucket.hueVectorX, bucket.hueVectorY),
      isNeutral: isLikelyNeutralColor({
        s: bucket.saturationTotal / bucket.weight,
        l: bucket.lightnessTotal / bucket.weight,
      }),
      lightness: bucket.lightnessTotal / bucket.weight,
      pixelCount: bucket.pixelCount,
      saturation: bucket.saturationTotal / bucket.weight,
      weight: bucket.weight,
    }))
    .sort((first, second) => second.weight - first.weight);
}

function choosePrimaryCandidate(candidates: PaletteCandidate[]) {
  return (
    selectCandidate(
      candidates,
      (candidate) => {
        const coverageScore = Math.min(candidate.coverage * 10, 2.8);
        const saturationScore = candidate.saturation * 2.5;
        const lightnessBalance =
          1 - Math.min(1, Math.abs(candidate.lightness - 0.48) / 0.48);
        const neutralPenalty = candidate.isNeutral ? 1.15 : 0;

        return (
          candidate.weight +
          coverageScore +
          saturationScore +
          lightnessBalance -
          neutralPenalty
        );
      },
      (candidate) => !candidate.isNeutral || candidate.coverage > 0.34,
    ) || candidates[0]
  );
}

function chooseSecondaryCandidate(candidates: PaletteCandidate[], primary: PaletteCandidate) {
  return selectCandidate(
    candidates,
    (candidate) => {
      const hueDelta = getHueDistance(candidate.hue, primary.hue) / 180;
      const lightnessDelta = Math.abs(candidate.lightness - primary.lightness);
      const contrast = Math.min(getContrastRatio(candidate.hex, primary.hex), 4.5) / 4.5;
      const colorDistance = getColorDistance(candidate.hex, primary.hex) / 120;
      const neutralPenalty = candidate.isNeutral ? 0.4 : 0;

      return (
        candidate.weight * 0.5 +
        colorDistance +
        hueDelta * 2.2 +
        lightnessDelta * 1.8 +
        contrast -
        neutralPenalty
      );
    },
    (candidate) =>
      candidate.hex !== primary.hex && hasEnoughPaletteDifference(candidate, [primary]),
  );
}

function chooseAccentCandidate(
  candidates: PaletteCandidate[],
  primary: PaletteCandidate,
  secondary: PaletteCandidate | null,
) {
  const baseColors = secondary ? [primary, secondary] : [primary];

  return selectCandidate(
    candidates,
    (candidate) => {
      const hueDistancePrimary = getHueDistance(candidate.hue, primary.hue) / 180;
      const hueDistanceSecondary = secondary
        ? getHueDistance(candidate.hue, secondary.hue) / 180
        : 0.45;
      const colorDistancePrimary = getColorDistance(candidate.hex, primary.hex) / 132;
      const colorDistanceSecondary = secondary
        ? getColorDistance(candidate.hex, secondary.hex) / 132
        : 0.45;
      const lightnessBalance =
        1 - Math.min(1, Math.abs(candidate.lightness - 0.52) / 0.52);
      const neutralPenalty = candidate.isNeutral ? 1.3 : 0;

      return (
        candidate.saturation * 3 +
        candidate.weight * 0.35 +
        colorDistancePrimary +
        colorDistanceSecondary * 0.8 +
        hueDistancePrimary * 1.8 +
        hueDistanceSecondary +
        lightnessBalance -
        neutralPenalty
      );
    },
    (candidate) => {
      if (candidate.hex === primary.hex || secondary?.hex === candidate.hex) {
        return false;
      }

      if (candidate.lightness < 0.16 || candidate.lightness > 0.82) {
        return false;
      }

      return hasEnoughPaletteDifference(candidate, baseColors);
    },
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

  const maxDimension = 144;
  const scale = Math.min(maxDimension / image.width, maxDimension / image.height, 1);
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));

  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
  const buckets = new Map<string, PaletteBucket>();

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

    if (isExtremeImageColor(hsl)) {
      continue;
    }

    const quantized = {
      r: quantizeChannel(rawColor.r),
      g: quantizeChannel(rawColor.g),
      b: quantizeChannel(rawColor.b),
    };
    const hex = rgbToHex(quantized);
    const weight = getPixelPaletteWeight(hsl, alpha);
    const current = buckets.get(hex) || {
      pixelCount: 0,
      saturationTotal: 0,
      lightnessTotal: 0,
      hueVectorX: 0,
      hueVectorY: 0,
      weight: 0,
    };
    const hueRadians = (hsl.h * Math.PI) / 180;

    buckets.set(hex, {
      pixelCount: current.pixelCount + 1,
      saturationTotal: current.saturationTotal + hsl.s * weight,
      lightnessTotal: current.lightnessTotal + hsl.l * weight,
      hueVectorX: current.hueVectorX + Math.cos(hueRadians) * weight,
      hueVectorY: current.hueVectorY + Math.sin(hueRadians) * weight,
      weight: current.weight + weight,
    });
  }

  const candidates = createPaletteCandidates(buckets);

  if (candidates.length === 0) {
    return {
      cor_primaria: DEFAULT_THEME.cor_primaria,
      cor_secundaria: DEFAULT_THEME.cor_secundaria,
      cor_acento: DEFAULT_THEME.cor_acento,
    };
  }

  const primaryCandidate = choosePrimaryCandidate(candidates);
  const secondaryCandidate = chooseSecondaryCandidate(candidates, primaryCandidate);
  const secondary = secondaryCandidate?.hex || buildSecondaryFallback(primaryCandidate);
  const accentCandidate = chooseAccentCandidate(
    candidates,
    primaryCandidate,
    secondaryCandidate,
  );
  const accent =
    accentCandidate?.hex || buildAccentFallback(primaryCandidate, secondary);

  return {
    cor_primaria: primaryCandidate.hex,
    cor_secundaria: secondary,
    cor_acento: accent,
  };
}

export { DEFAULT_THEME as DEFAULT_SYSTEM_CONFIG };
