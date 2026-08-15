const StatusBadge = ({ type = "order", value }) => {
  if (!value) return null;

  const normalized = String(value).toLowerCase().replace(/\s+/g, "-");

  return (
    <span className={`admin-badge ${type}-${normalized}`}>
      {value}
    </span>
  );
};

export default StatusBadge;
