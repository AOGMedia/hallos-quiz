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
const isCampaignQuizRoute = window.location.pathname === "/campaign/quiz";
const urlToken = params.get("token");

if (urlToken && !isCampaignQuizRoute) {
  sessionStorage.setItem("auth_token", urlToken);
  // Only remove the JWT token param; leave other params (e.g. ?ctoken= for campaign quiz)
  params.delete("token");
  const remaining = params.toString();
  const cleanUrl =
    window.location.pathname +
    (remaining ? "?" + remaining : "") +
    window.location.hash;
  window.history.replaceState({}, "", cleanUrl);
}

// For campaign quiz route, save the campaign token to sessionStorage immediately
if (isCampaignQuizRoute && urlToken) {
  sessionStorage.setItem("campaign_token", urlToken);
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
