import axios from "axios";
import { getToken } from "@/store/authStore";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// Attach auth token from sessionStorage on every request
apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message =
      error.response?.data?.message ?? error.message ?? "Request failed";

    if (status === 401) {
      // Token missing or expired — clear session and send back to main platform.
      // The main platform's auth guard will redirect to signin and preserve
      // the destination so the user lands back on the quiz after signing in.
      sessionStorage.removeItem("auth_token");
      sessionStorage.removeItem("userProfile");
      sessionStorage.removeItem("currentMatch");
      sessionStorage.removeItem("matchEnded");
      window.location.href = "https://www.hallos.net/dashboard/games";
      return new Promise(() => {}); // prevent further error propagation
    }

    console.error("API Error:", message, error.response?.data);
    return Promise.reject(new Error(message));
  }
);

export default apiClient;
