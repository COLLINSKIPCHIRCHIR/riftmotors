import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5004/api";

const API = axios.create({
  baseURL: BASE_URL,
});

// Backend origin without the /api suffix — use this to build URLs for
// static files like /uploads/xyz.jpg, which are served outside /api.
export const API_ORIGIN = BASE_URL.replace(/\/api\/?$/, "");

// Attach token to every request automatically
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 globally — token expired or invalid
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default API;