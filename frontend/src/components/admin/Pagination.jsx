const Pagination = ({ page, pages, total, onPageChange }) => {
  if (!pages || pages <= 1) return null;

  const prev = () => onPageChange(Math.max(page - 1, 1));
  const next = () => onPageChange(Math.min(page + 1, pages));

  return (
    <div className="admin-pagination">
      <span className="admin-pagination-info">
        Page {page} of {pages}
        {total !== undefined ? ` · ${total} total` : ""}
      </span>
      <div className="admin-pagination-controls">
        <button
          type="button"
          className="admin-btn admin-btn-secondary admin-btn-sm"
          onClick={prev}
          disabled={page <= 1}
        >
          Previous
        </button>
        <button
          type="button"
          className="admin-btn admin-btn-secondary admin-btn-sm"
          onClick={next}
          disabled={page >= pages}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Pagination;
