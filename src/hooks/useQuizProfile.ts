import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  checkNickname,
  registerQuizUser,
  fetchQuizProfile,
  updateQuizProfile,
  type RegisterQuizPayload,
  type UpdateProfilePayload,
} from "@/lib/api/quizProfile";
import { useQuizProfileStore } from "@/store/quizProfileStore";

export const PROFILE_KEYS = {
  profile: (userId: number) => ["quiz", "profile", userId] as const,
};

// ── Nickname availability (debounced) ─────────────────────────────────────────

export function useNicknameCheck(nickname: string) {
  const [debouncedNickname, setDebouncedNickname] = useState("");

  useEffect(() => {
    if (nickname.length < 3) {
      setDebouncedNickname("");
      return;
    }
    const t = setTimeout(() => setDebouncedNickname(nickname), 300);
    return () => clearTimeout(t);
  }, [nickname]);

  return useQuery({
    queryKey: ["quiz", "nickname-check", debouncedNickname],
    queryFn: () => checkNickname(debouncedNickname),
    enabled: debouncedNickname.length >= 3,
    staleTime: 10_000,
  });
}

// ── Register ──────────────────────────────────────────────────────────────────

export function useRegisterQuiz() {
  const setProfile = useQuizProfileStore((s) => s.setProfile);

  return useMutation({
    mutationFn: (payload: RegisterQuizPayload) => registerQuizUser(payload),
    onSuccess: (data) => {
      if (data.success) {
        // Seed a minimal profile into the store immediately
        setProfile({
          userId: 0,
          nickname: data.nickname,
          avatarUrl: data.avatarUrl,
          lobbyStats: { totalMatches: 0, wins: 0, losses: 0, winRate: 0, totalWinnings: 0 },
          tournamentStats: { tournamentsEntered: 0, tournamentsWon: 0, top3Finishes: 0, totalPrizeMoney: 0 },
          overallStats: { totalQuestions: 0, correctAnswers: 0, accuracy: 0 },
          lastMatchAt: null,
          lastTournamentAt: null,
        });
      }
    },
  });
}

// ── Fetch profile ─────────────────────────────────────────────────────────────

export function useQuizProfileQuery(userId: number) {
  const setProfile = useQuizProfileStore((s) => s.setProfile);

  const query = useQuery({
    queryKey: PROFILE_KEYS.profile(userId),
    queryFn: () => fetchQuizProfile(userId),
    enabled: userId > 0,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (query.data?.profile) {
      setProfile(query.data.profile);
    }
  }, [query.data, setProfile]);

  return query;
}

// ── Update profile ────────────────────────────────────────────────────────────

export function useUpdateQuizProfile(userId: number) {
  const qc = useQueryClient();
  const setProfile = useQuizProfileStore((s) => s.setProfile);
  const currentProfile = useQuizProfileStore((s) => s.profile);

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => updateQuizProfile(payload),
    onSuccess: (data) => {
      if (data.success && currentProfile) {
        setProfile({ ...currentProfile, ...data.profile });
        qc.invalidateQueries({ queryKey: PROFILE_KEYS.profile(userId) });
      }
    },
  });
}
