export function buildVariationLabel(variacao, showSaldo = false) {
  const partes = [];

  if (variacao.cor) {
    partes.push(variacao.cor);
  }
  if (variacao.tamanho) {
    partes.push(`Tam. ${variacao.tamanho}`);
  }
  if (variacao.numeracao) {
    partes.push(`Num. ${variacao.numeracao}`);
  }
  if (showSaldo) {
    partes.push(`Saldo ${Number(variacao.saldo_atual || 0)}`);
  }

  return partes.join(" | ") || "Variação simples";
}

export function matchesVariationSearch(variacoes, termo) {
  const termoNormalizado = String(termo || "").trim().toLowerCase();

  if (!termoNormalizado) {
    return false;
  }

  return (variacoes || []).some((variacao) => (
    [variacao.cor, variacao.tamanho, variacao.numeracao]
      .filter(Boolean)
      .some((valor) => String(valor).toLowerCase().includes(termoNormalizado))
  ));
}
