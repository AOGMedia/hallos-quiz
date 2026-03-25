import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // send cookies for auth
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ?? error.message ?? "Request failed";
    console.error("API Error:", message, error.response?.data);
    return Promise.reject(new Error(message));
  }
);

export default apiClient;
