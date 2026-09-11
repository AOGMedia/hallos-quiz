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
  async (error) => {
    const status = error.response?.status;
    // Two response shapes are in play: controllers return `{ success, message }`
    // directly, while anything routed through quizErrorHandler returns
    // `{ success, error: { type, message } }`. Reading only the first meant
    // every error from the platform's own error handler surfaced as a generic
    // axios string ("Request failed with status code 500") instead of the
    // server's actual reason.
    const message =
      error.response?.data?.message ??
      error.response?.data?.error?.message ??
      error.message ??
      "Request failed";

    if (status === 401) {
      // A single 401 isn't necessarily a genuinely expired/invalid token — a
      // brief backend hiccup or a deploy-time blip can produce one for an
      // otherwise perfectly good session. Hard-logging out on the very first
      // 401 (the old behavior) short-circuited before React Query's own
      // retry logic ever got a chance to run, so a legitimately signed-in
      // user got kicked to sign-in for a transient failure that would have
      // succeeded a moment later. Retry the exact same request once — only
      // treat it as a real auth failure if the retry *also* 401s.
      if (error.config && !error.config._retriedAfter401) {
        error.config._retriedAfter401 = true;
        await new Promise((resolve) => setTimeout(resolve, 500));
        return apiClient(error.config);
      }

      // Genuine auth failure — clear session and send back to main platform,
      // preserving where the user was so they land back here (not just the
      // bare dashboard) after signing in again.
      sessionStorage.removeItem("auth_token");
      sessionStorage.removeItem("userProfile");
      sessionStorage.removeItem("currentMatch");
      sessionStorage.removeItem("matchEnded");
      const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `https://www.hallos.net/dashboard/games?redirect=${returnTo}`;
      return new Promise(() => {}); // prevent further error propagation
    }

    console.error("API Error:", message, error.response?.data);

    // Reject with an Error carrying the HTTP status alongside the message.
    // Callers have always read `.message`, and that is unchanged — but the
    // status was previously discarded, so nothing could distinguish "404, this
    // genuinely doesn't exist" from a transient failure. `response.status` is
    // shaped to match axios so existing `err.response?.status` checks work too.
    const enriched = new Error(message) as Error & {
      status?: number;
      response?: { status?: number; data?: unknown };
    };
    if (status !== undefined) {
      enriched.status = status;
      enriched.response = { status, data: error.response?.data };
    }
    return Promise.reject(enriched);
  }
);

export default apiClient;
