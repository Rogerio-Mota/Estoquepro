import { buildVariationLabel } from "@/components/products/variationUtils";

export default function VariationsPreview({
  variacoes = [],
  showSaldo = false,
  maxItems = 3,
  emptyLabel = "",
}) {
  if (!Array.isArray(variacoes) || variacoes.length === 0) {
    return emptyLabel ? <div className="table-cell-meta">{emptyLabel}</div> : null;
  }

  const variacoesVisiveis = variacoes.slice(0, maxItems);
  const variacoesRestantes = Math.max(variacoes.length - variacoesVisiveis.length, 0);

  return (
    <div className="variation-preview" aria-label="Resumo das variações do produto">
      {variacoesVisiveis.map((variacao) => {
        const semSaldo = Number(variacao.saldo_atual || 0) <= 0;

        return (
          <span
            key={variacao.id || buildVariationLabel(variacao, showSaldo)}
            className={`variation-chip ${semSaldo ? "variation-chip--empty" : ""}`}
          >
            {buildVariationLabel(variacao, showSaldo)}
          </span>
        );
      })}

      {variacoesRestantes > 0 ? (
        <span className="variation-chip variation-chip--more">
          +{variacoesRestantes} variação(ões)
        </span>
      ) : null}
    </div>
  );
}
