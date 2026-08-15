const LoadingSkeleton = ({ rows = 5, columns = 6 }) => (
  <div className="admin-skeleton-table">
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="admin-skeleton-row">
        {Array.from({ length: columns }).map((__, colIndex) => (
          <div key={colIndex} className="admin-skeleton-cell" />
        ))}
      </div>
    ))}
  </div>
);

export default LoadingSkeleton;
