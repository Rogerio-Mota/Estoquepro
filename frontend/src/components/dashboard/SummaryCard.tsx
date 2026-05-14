export default function SummaryCard({ title, value, tone = "blue", caption }) {
  return (
    <article className={`summary-card summary-card--${tone}`}>
      <p className="summary-card__label">{title}</p>
      <strong className="summary-card__value">{value}</strong>
      {caption ? <p className="summary-card__caption">{caption}</p> : null}
    </article>
  );
}
