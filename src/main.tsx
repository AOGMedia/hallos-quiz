import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.tsx";
import "./index.css";

// ── Token handoff from hallos.net ─────────────────────────────────────────────
// The main frontend passes ?token=<jwt> when redirecting here.
// We store it in sessionStorage and immediately clean the URL so the token
// is never visible in the browser history or referrer headers.
const params = new URLSearchParams(window.location.search);
const urlToken = params.get("token");
if (urlToken) {
  sessionStorage.setItem("auth_token", urlToken);
  // Remove token from URL without triggering a page reload
  const cleanUrl = window.location.pathname + window.location.hash;
  window.history.replaceState({}, "", cleanUrl);
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
