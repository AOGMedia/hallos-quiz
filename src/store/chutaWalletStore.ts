import { create } from "zustand";

interface ChutaWalletState {
  balance: number;
  setBalance: (balance: number) => void;
}

export const useChutaWalletStore = create<ChutaWalletState>((set) => ({
  balance: 0,
  setBalance: (balance) => set({ balance }),
}));
