export const CATEGORY_OPTIONS = [
  { value: "roupa", label: "Roupa" },
  { value: "calcado", label: "Calçado" },
  { value: "acessorio", label: "Acessório" },
  { value: "perfumaria", label: "Perfumaria" },
  { value: "geral", label: "Geral" },
];

export const SUBCATEGORY_OPTIONS_BY_CATEGORY = {
  roupa: [
    { value: "camisa", label: "Camisa" },
    { value: "calca", label: "Calça" },
    { value: "bermuda", label: "Bermuda" },
  ],
  calcado: [{ value: "tenis", label: "Tênis" }],
  acessorio: [
    { value: "cinto", label: "Cinto" },
    { value: "bijuteria", label: "Bijuteria Masculina" },
  ],
  perfumaria: [{ value: "perfume", label: "Perfume" }],
  geral: [{ value: "geral", label: "Geral" }],
};

export const SIZE_OPTIONS = [
  { value: "", label: "Selecione o tamanho" },
  { value: "PP", label: "PP" },
  { value: "P", label: "P" },
  { value: "M", label: "M" },
  { value: "G", label: "G" },
  { value: "GG", label: "GG" },
  { value: "U", label: "Único" },
];

export const NUMBER_OPTIONS = [
  { value: "", label: "Selecione a numeração" },
  { value: "36", label: "36" },
  { value: "37", label: "37" },
  { value: "38", label: "38" },
  { value: "39", label: "39" },
  { value: "40", label: "40" },
  { value: "41", label: "41" },
  { value: "42", label: "42" },
  { value: "43", label: "43" },
  { value: "44", label: "44" },
  { value: "45", label: "45" },
  { value: "46", label: "46" },
];

const categoryLabels = Object.fromEntries(
  CATEGORY_OPTIONS.map((item) => [item.value, item.label]),
);
const subcategoryLabels = Object.fromEntries(
  Object.values(SUBCATEGORY_OPTIONS_BY_CATEGORY)
    .flat()
    .map((item) => [item.value, item.label]),
);

export function getSubcategoryOptions(category) {
  return SUBCATEGORY_OPTIONS_BY_CATEGORY[category] || [];
}

export function usesSize(subcategory) {
  return ["camisa", "calca", "bermuda", "cinto", "bijuteria", "perfume"].includes(
    subcategory,
  );
}

export function usesNumber(subcategory) {
  return subcategory === "tenis";
}

export function getCategoryLabel(value) {
  return categoryLabels[value] || value || "-";
}

export function getSubcategoryLabel(value) {
  return subcategoryLabels[value] || value || "-";
}
