const EmptyState = ({ title = "No data found", message, action }) => (
  <div className="admin-empty">
    <h3>{title}</h3>
    {message && <p>{message}</p>}
    {action}
  </div>
);

export default EmptyState;
