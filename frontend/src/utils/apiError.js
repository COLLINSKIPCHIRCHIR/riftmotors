export const getApiErrorMessage = (err, fallback = "Something went wrong") => {
  if (err.response) {
    const { status, data } = err.response;
    if (data?.error) return data.error;
    if (status === 413) return "Images are too large for the server. Use smaller or fewer photos.";
    if (status === 401) return "Your session has expired. Please log in again.";
    if (status === 403) return "You don't have permission to do this.";
    if (status === 404) return "The server endpoint was not found.";
    if (status === 502 || status === 503 || status === 504)
      return "The server is down or restarting. Try again in a moment.";
    return `${fallback} (server returned ${status})`;
  }
  if (err.code === "ECONNABORTED") return "The request timed out. Check your connection or try fewer images.";
  if (err.request)
    return "Could not reach the server. Possible causes: upload too large, server down, or network/CORS blocked.";
  return err.message || fallback;
};