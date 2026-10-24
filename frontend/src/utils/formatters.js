export const formatCurrency = (amount, currency = "ETB") => {
  const value = Number(amount) || 0;
  return `${currency} ${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Safely formats large numbers compactly using Intl compact notation:
 * e.g., 1,500,000 -> "1.5M", 1,200,000 -> "1.2M", 15,000 -> "15K"
 */
export const formatCompactNumber = (amount, maximumFractionDigits = 2) => {
  const value = Number(amount) || 0;
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits,
  }).format(value);
};

/**
 * Safely formats currency for dashboard KPI cards:
 * - Numbers >= 1,000,000 format in compact notation (e.g. "ETB 1.2M", "ETB 1.5M")
 * - Numbers >= 100,000 format cleanly without decimal cents (e.g. "ETB 150,000")
 * - Numbers >= 1,000 format cleanly with separators (e.g. "ETB 1,500.00")
 * - Compact thousands can be enabled via options.compactThousands (e.g. "ETB 1.5K")
 */
export const formatCompactCurrency = (amount, currency = "ETB", options = {}) => {
  const value = Number(amount) || 0;
  const { compactThousands = false, maximumFractionDigits = 2 } =
    typeof options === "boolean" ? { compactThousands: options } : options;

  if (Math.abs(value) >= 1_000_000 || (compactThousands && Math.abs(value) >= 1_000)) {
    const compact = new Intl.NumberFormat("en", {
      notation: "compact",
      maximumFractionDigits,
    }).format(value);
    return `${currency} ${compact}`;
  }
  if (Math.abs(value) >= 100_000) {
    return `${currency} ${value.toLocaleString("en-US", {
      maximumFractionDigits: 0,
    })}`;
  }
  return formatCurrency(value, currency);
};

export const formatRevenue = (amount, currency = "ETB") =>
  formatCompactCurrency(amount, currency);

export const formatDate = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const formatDateTime = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const getInitials = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "A";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
};

export const shortOrderId = (id = "") =>
  id ? `#${id.slice(-8).toUpperCase()}` : "—";

export const percentOf = (part, total) => {
  if (!total || total <= 0) return 0;
  return Math.round((part / total) * 100);
};
