import { create } from "zustand";
import type { Tournament, TournamentDetail } from "@/lib/api/tournament";

type TournamentView = "arena" | "history" | "host" | "detail" | "leaderboard";

interface TournamentState {
  // Navigation
  view: TournamentView;
  selectedId: string;
  selectedName: string;

  // Cached data
  tournaments: Tournament[];
  selectedDetail: TournamentDetail | null;
  registeredIds: Set<string>;

  // Actions
  setView: (view: TournamentView) => void;
  selectTournament: (id: string, name?: string) => void;
  setTournaments: (list: Tournament[]) => void;
  setSelectedDetail: (detail: TournamentDetail) => void;
  markRegistered: (id: string) => void;
  markUnregistered: (id: string) => void;
  isRegistered: (id: string) => boolean;
}

export const useTournamentStore = create<TournamentState>((set, get) => ({
  view: "arena",
  selectedId: "",
  selectedName: "",
  tournaments: [],
  selectedDetail: null,
  registeredIds: new Set(),

  setView: (view) => set({ view }),

  selectTournament: (id, name = "") => set({ selectedId: id, selectedName: name, view: "detail" }),

  setTournaments: (list) => set({ tournaments: list }),

  setSelectedDetail: (detail) => set({ selectedDetail: detail }),

  markRegistered: (id) =>
    set((s) => ({ registeredIds: new Set([...s.registeredIds, id]) })),

  markUnregistered: (id) =>
    set((s) => {
      const next = new Set(s.registeredIds);
      next.delete(id);
      return { registeredIds: next };
    }),

  isRegistered: (id) => get().registeredIds.has(id),
}));
