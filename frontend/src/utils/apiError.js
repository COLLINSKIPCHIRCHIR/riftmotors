export const getApiErrorMessage = (err, fallback = "Something went wrong") => {
  if (err.response) {
    const { status, data } = err.response;

    // express-validator responses: { message, errors: [{ msg, path }] }
    if (Array.isArray(data?.errors) && data.errors.length)
      return data.errors.map((e) => e.msg).join("\n");

    if (data?.error) return data.error;
    if (status === 413) return "Images are too large for the server. Use smaller or fewer photos.";
    if (status === 401) return "Your session has expired. Please log in again.";
    if (status === 502 || status === 503 || status === 504)
      return "The server is down or restarting. Try again in a moment.";

    // Specific message from our own controllers (e.g. "Spare part not found")
    if (data?.message) return data.message;

    if (status === 403) return "You don't have permission to do this.";
    if (status === 404) return "The server endpoint was not found.";
    return `${fallback} (server returned ${status})`;
  }
  if (err.code === "ECONNABORTED") return "The request timed out. Check your connection or try fewer images.";
  if (err.request)
    return "Could not reach the server. Possible causes: upload too large, server down, or network/CORS blocked.";
  return err.message || fallback;
};

// Maps validator errors to fields: { part_number: "Part number is required", ... }
export const getFieldErrors = (err) => {
  const map = {};
  (err.response?.data?.errors || []).forEach((e) => {
    if (e.path && !map[e.path]) map[e.path] = e.msg;
  });
  return map;
};