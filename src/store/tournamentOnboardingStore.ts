import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TournamentOnboardingState {
  /**
   * Keyed by userId rather than a single flag — this store is persisted to
   * localStorage, which is shared across every account that signs in on this
   * browser (see quizProfileStore's ownerUserId comment for the exact failure
   * this avoids). A per-user map means a second account signing in on the same
   * device is never mistaken for "already seen the walkthrough".
   */
  seenByUserId: Record<number, true>;
  markSeen: (userId: number) => void;
}

export const useTournamentOnboardingStore = create<TournamentOnboardingState>()(
  persist(
    (set) => ({
      seenByUserId: {},
      markSeen: (userId) =>
        set((state) => ({ seenByUserId: { ...state.seenByUserId, [userId]: true } })),
    }),
    { name: "tournament-onboarding" }
  )
);

export function hasSeenTournamentIntro(userId: number | null): boolean {
  if (!userId) return false;
  return useTournamentOnboardingStore.getState().seenByUserId[userId] === true;
}
