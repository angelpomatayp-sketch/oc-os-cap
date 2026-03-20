const PAGE_SIZE = 10;

export function usePagination<T>(items: T[], page: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = items.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  return { pageItems, totalPages, safePage };
}

export function Pagination({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="pagination">
      <button
        type="button"
        className="btn-action"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
      >
        ← Anterior
      </button>
      <span className="pagination__info">
        Página {page} de {totalPages}
      </span>
      <button
        type="button"
        className="btn-action"
        disabled={page >= totalPages}
        onClick={() => onPage(page + 1)}
      >
        Siguiente →
      </button>
    </div>
  );
}
