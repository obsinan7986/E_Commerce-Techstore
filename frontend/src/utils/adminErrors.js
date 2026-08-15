export const getAdminErrorMessage = (error, fallback = "Something went wrong.") => {
  if (!error) return fallback;

  if (error.response?.status === 403) {
    return error.response?.data?.message || "Admin access required.";
  }

  if (error.response?.status === 401) {
    return "Your session has expired. Please log in again.";
  }

  if (error.response?.status === 404) {
    return error.response?.data?.message || "Resource not found.";
  }

  if (!error.response) {
    return "Network error. Check your connection and try again.";
  }

  return error.response?.data?.message || fallback;
};

export const isAdminForbidden = (error) => error?.response?.status === 403;

export const isUnauthorized = (error) => error?.response?.status === 401;
