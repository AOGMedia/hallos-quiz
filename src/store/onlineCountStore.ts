import { create } from "zustand";

interface OnlineCountStore {
  count: number;
  setCount: (n: number) => void;
}

export const useOnlineCountStore = create<OnlineCountStore>((set) => ({
  count: 0,
  setCount: (n) => set({ count: n }),
}));
