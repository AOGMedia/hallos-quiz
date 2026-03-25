import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { QuizProfile } from "@/lib/api/quizProfile";

interface QuizProfileState {
  profile: QuizProfile | null;
  isRegistered: boolean;
  setProfile: (profile: QuizProfile) => void;
  clearProfile: () => void;
}

export const useQuizProfileStore = create<QuizProfileState>()(
  persist(
    (set) => ({
      profile: null,
      isRegistered: false,
      setProfile: (profile) => set({ profile, isRegistered: true }),
      clearProfile: () => set({ profile: null, isRegistered: false }),
    }),
    { name: "quiz-profile" } // persisted to localStorage
  )
);
