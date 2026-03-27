import { create } from "zustand";

interface AuthState {
  token: string | null;
  setToken: (token: string) => void;
  clearToken: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  // Seed from sessionStorage on init (survives refresh, cleared on tab close)
  token: sessionStorage.getItem("auth_token"),

  setToken: (token) => {
    sessionStorage.setItem("auth_token", token);
    set({ token });
  },

  clearToken: () => {
    sessionStorage.removeItem("auth_token");
    set({ token: null });
  },
}));

/** Read token without subscribing to store — safe to call outside React */
export const getToken = (): string | null =>
  sessionStorage.getItem("auth_token");
