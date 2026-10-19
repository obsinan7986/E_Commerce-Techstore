import React from "react";
import "../styles/pagination.css";

const Pagination = ({
  currentPage = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);

  const startEntry = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endEntry = Math.min(totalItems, safePage * pageSize);

  // Generate page numbers with ellipsis
  const getPageNumbers = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = [];
    if (safePage <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i);
      pages.push("...");
      pages.push(totalPages);
    } else if (safePage >= totalPages - 3) {
      pages.push(1);
      pages.push("...");
      for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      pages.push("...");
      pages.push(safePage - 1);
      pages.push(safePage);
      pages.push(safePage + 1);
      pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="pagination-container" aria-label="Table pagination">
      {/* Left info label */}
      <div className="pagination-info">
        {totalItems > 0 ? (
          <>
            Showing <strong>{startEntry}</strong> to <strong>{endEntry}</strong> of{" "}
            <strong>{totalItems}</strong> entries
          </>
        ) : (
          <span>No entries to display</span>
        )}
      </div>

      {/* Right controls */}
      <div className="pagination-controls">
        {onPageSizeChange && (
          <div className="pagination-pagesize">
            <label htmlFor="pagination-rows-select" className="pagination-pagesize-label">
              Rows:
            </label>
            <select
              id="pagination-rows-select"
              className="pagination-select"
              value={pageSize}
              onChange={(e) => {
                const newSize = Number(e.target.value);
                if (onPageSizeChange) onPageSizeChange(newSize);
                if (onPageChange) onPageChange(1);
              }}
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} / page
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="pagination-buttons">
          <button
            type="button"
            className="pagination-btn"
            disabled={safePage <= 1}
            onClick={() => onPageChange && onPageChange(safePage - 1)}
            aria-label="Previous Page"
          >
            Prev
          </button>

          {getPageNumbers().map((p, idx) =>
            p === "..." ? (
              <span key={`ellipsis-${idx}`} className="pagination-ellipsis">
                …
              </span>
            ) : (
              <button
                key={`page-${p}`}
                type="button"
                className={`pagination-btn ${safePage === p ? "pagination-btn--active" : ""}`}
                onClick={() => onPageChange && onPageChange(p)}
                aria-label={`Page ${p}`}
                aria-current={safePage === p ? "page" : undefined}
              >
                {p}
              </button>
            )
          )}

          <button
            type="button"
            className="pagination-btn"
            disabled={safePage >= totalPages}
            onClick={() => onPageChange && onPageChange(safePage + 1)}
            aria-label="Next Page"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pagination;
