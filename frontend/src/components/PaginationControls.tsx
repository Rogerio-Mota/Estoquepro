type PaginationControlsProps = {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
};

export default function PaginationControls({
  page,
  totalPages,
  onChange,
}: PaginationControlsProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="pagination">
      <button
        type="button"
        className="button-secondary"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
      >
        Anterior
      </button>

      <span className="pagination__label">
        Pagina {page} de {totalPages}
      </span>

      <button
        type="button"
        className="button-secondary"
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
      >
        Proxima
      </button>
    </div>
  );
}
