import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { QuizProfile } from "@/lib/api/quizProfile";
import { getMyUserId } from "@/lib/auth/currentUser";

interface QuizProfileState {
  profile: QuizProfile | null;
  isRegistered: boolean;
  /**
   * Which user this persisted profile belongs to.
   *
   * This store is persisted to localStorage, which is shared across every
   * account that signs in on this browser. Without an owner stamp, signing in
   * as a second user inherited the first user's `isRegistered: true` — so the
   * app skipped profile setup, showed a stale identity, and then 404'd when it
   * asked the server for the new user's profile. Anything reading this store
   * must confirm the owner matches the current token; use `hasQuizProfile()`
   * below rather than reading localStorage directly.
   */
  ownerUserId: number | null;
  setProfile: (profile: QuizProfile) => void;
  clearProfile: () => void;
}

export const useQuizProfileStore = create<QuizProfileState>()(
  persist(
    (set) => ({
      profile: null,
      isRegistered: false,
      ownerUserId: null,
      setProfile: (profile) =>
        set({
          profile,
          isRegistered: true,
          // Prefer the id the server returned; fall back to the token's.
          ownerUserId: profile.userId ?? getMyUserId(),
        }),
      clearProfile: () => set({ profile: null, isRegistered: false, ownerUserId: null }),
    }),
    { name: "quiz-profile" } // persisted to localStorage
  )
);

/**
 * Does the *currently signed-in* user have a quiz profile?
 *
 * The single place that answers this question. Returns false when the
 * persisted profile belongs to a different account, so a stale entry from a
 * previous sign-in can never stand in for the current user's registration.
 *
 * Profiles persisted before `ownerUserId` existed have no owner recorded. Those
 * are trusted only when they carry an explicit `profile.userId` matching the
 * current user — an unowned, profile-less `isRegistered` flag is treated as
 * unregistered, which routes the user through setup rather than into a broken
 * identity.
 */
export function hasQuizProfile(): boolean {
  const currentUserId = getMyUserId();
  if (!currentUserId) return false;

  const { profile, isRegistered, ownerUserId } = useQuizProfileStore.getState();

  if (isRegistered) {
    const owner = ownerUserId ?? profile?.userId ?? null;
    if (owner === currentUserId) return true;
    // Owned by someone else — fall through rather than returning true.
  }

  // sessionStorage fallback, preserved from the per-component copies this
  // replaced. ProfileSetup writes `userProfile` here as soon as registration
  // succeeds, which can be before the persisted store has rehydrated — without
  // this, a just-registered invitee looks unregistered for those first renders
  // and the pending-invite banner vanishes.
  //
  // Safe against cross-account leakage: sessionStorage is per-tab, and
  // clearProfileIfNotOwnedByCurrentUser() wipes it at startup whenever it
  // belonged to a different user.
  try {
    const session = sessionStorage.getItem("userProfile");
    if (session && JSON.parse(session)?.nickname) return true;
  } catch {
    /* ignore */
  }

  return false;
}

/**
 * Drop a persisted profile that belongs to someone else. Call this on startup,
 * before anything reads the store, so a stale identity can't leak into the UI
 * for even one render.
 */
export function clearProfileIfNotOwnedByCurrentUser(): void {
  const currentUserId = getMyUserId();
  const { profile, isRegistered, ownerUserId } = useQuizProfileStore.getState();
  if (!isRegistered && !profile) return;

  const owner = ownerUserId ?? profile?.userId ?? null;
  if (owner !== currentUserId) {
    useQuizProfileStore.getState().clearProfile();
    // sessionStorage mirrors the same identity for AppLayout's fast path.
    try {
      sessionStorage.removeItem("userProfile");
    } catch {
      /* ignore */
    }
  }
}
