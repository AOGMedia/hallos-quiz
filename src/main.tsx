import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App.tsx";
import "./index.css";

// ── Token handoff from hallos.net ─────────────────────────────────────────────
// The main frontend passes ?token=<jwt> when redirecting here.
// We store it in sessionStorage and immediately clean the URL so the token
// is never visible in the browser history or referrer headers.
console.log("[main.tsx] window.location.pathname:", window.location.pathname);
console.log("[main.tsx] window.location.search:", window.location.search);
const params = new URLSearchParams(window.location.search);
const isCampaignQuizRoute = window.location.pathname === "/campaign/quiz";
const urlToken = params.get("token");
console.log("[main.tsx] isCampaignQuizRoute:", isCampaignQuizRoute);
console.log("[main.tsx] urlToken:", urlToken);

if (urlToken) {
  if (isCampaignQuizRoute) {
    // On campaign quiz route: save token but DO NOT remove from URL
    console.log("[main.tsx] Saving campaign token to sessionStorage");
    sessionStorage.setItem("campaign_token", urlToken);
  } else {
    // On all other routes: treat as auth token, save and remove from URL
    console.log("[main.tsx] Saving auth token and cleaning URL");
    sessionStorage.setItem("auth_token", urlToken);
    params.delete("token");
    const remaining = params.toString();
    const cleanUrl =
      window.location.pathname +
      (remaining ? "?" + remaining : "") +
      window.location.hash;
    window.history.replaceState({}, "", cleanUrl);
  }
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
