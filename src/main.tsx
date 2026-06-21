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
const path = window.location.pathname;
// Check path with trailing slash support
const isCampaignQuizRoute = path === "/campaign/quiz" || path === "/campaign/quiz/";
const urlToken = params.get("token");
console.log("[main.tsx] isCampaignQuizRoute:", isCampaignQuizRoute);
console.log("[main.tsx] urlToken:", urlToken);

if (urlToken) {
  if (isCampaignQuizRoute) {
    // On campaign quiz route: FIRST check if this is an auth token? Wait no:
    // If we have a stored campaign token already, this new token is probably auth token!
    const existingCampaignToken = sessionStorage.getItem("campaign_token");
    if (existingCampaignToken) {
      console.log("[main.tsx] Existing campaign token found, treating new token as auth token");
      sessionStorage.setItem("auth_token", urlToken);
      // Now remove auth token from URL but LEAVE campaign token (if any)
      // Wait: but how do we know if the URL param is auth or campaign? Let's think:
      // If we already have campaign_token stored, then any new ?token is auth token!
      params.delete("token");
      const remainingParams = params.toString();
      const cleanUrl =
        window.location.pathname +
        (remainingParams ? "?" + remainingParams : "") +
        window.location.hash;
      window.history.replaceState({}, "", cleanUrl);
    } else {
      console.log("[main.tsx] Saving campaign token to sessionStorage");
      sessionStorage.setItem("campaign_token", urlToken);
      // DO NOT REMOVE campaign token from URL
    }
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

// If we're on campaign quiz route but have no token in URL, make sure we still have it in sessionStorage
if (isCampaignQuizRoute && !urlToken) {
  const storedCampaignToken = sessionStorage.getItem("campaign_token");
  if (storedCampaignToken) {
    console.log("[main.tsx] Restoring campaign token to URL from sessionStorage");
    // Restore token to URL for consistency
    const restoreParams = new URLSearchParams(window.location.search);
    restoreParams.set("token", storedCampaignToken);
    const restoredUrl =
      window.location.pathname +
      "?" + restoreParams.toString() +
      window.location.hash;
    window.history.replaceState({}, "", restoredUrl);
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
