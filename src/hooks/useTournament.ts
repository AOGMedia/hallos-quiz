import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  getTournaments,
  getTournamentDetail,
  getTournamentLeaderboard,
  registerForTournament,
  unregisterFromTournament,
  type GetTournamentsParams,
} from "@/lib/api/tournament";
import { useChutaWalletStore } from "@/store/chutaWalletStore";
import { useTournamentStore } from "@/store/tournamentStore";
import { isSampleTournament, getSampleTournamentDetail } from "@/data/tournamentData";

export const TOURNAMENT_KEYS = {
  list:        (p: GetTournamentsParams) => ["tournaments", "list", p] as const,
  detail:      (id: string)             => ["tournaments", "detail", id] as const,
  leaderboard: (id: string)             => ["tournaments", "leaderboard", id] as const,
};

export function useTournaments(params: GetTournamentsParams = {}) {
  const setTournaments = useTournamentStore((s) => s.setTournaments);

  const query = useQuery({
    queryKey: TOURNAMENT_KEYS.list(params),
    queryFn: () => getTournaments(params),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (query.data?.tournaments) setTournaments(query.data.tournaments);
  }, [query.data, setTournaments]);

  return query;
}

export function useTournamentDetail(id: string) {
  const setSelectedDetail = useTournamentStore((s) => s.setSelectedDetail);

  const query = useQuery({
    queryKey: TOURNAMENT_KEYS.detail(id),
    queryFn: async () => {
      // Try server first — if it succeeds, use real data
      try {
        return await getTournamentDetail(id);
      } catch {
        // If the tournament is a sample, return local mock data
        const sample = getSampleTournamentDetail(id);
        if (sample) return sample;
        // Otherwise re-throw so React Query treats it as an error
        throw new Error("Tournament not found");
      }
    },
    enabled: !!id,
    staleTime: 30_000,
    retry: (failureCount, error) => {
      // Don't retry for sample tournaments (the fallback already handled it)
      if (isSampleTournament(id)) return false;
      return failureCount < 2;
    },
  });

  useEffect(() => {
    if (query.data?.tournament) setSelectedDetail(query.data.tournament);
  }, [query.data, setSelectedDetail]);

  return query;
}

export function useTournamentLeaderboard(id: string) {
  return useQuery({
    queryKey: TOURNAMENT_KEYS.leaderboard(id),
    queryFn: () => getTournamentLeaderboard(id),
    enabled: !!id,
    staleTime: 15_000,
    refetchInterval: 15_000, // live standings
  });
}

export function useRegisterTournament(id: string) {
  const qc = useQueryClient();
  const setBalance = useChutaWalletStore((s) => s.setBalance);
  const getBalance = useChutaWalletStore((s) => s.balance);
  const markRegistered = useTournamentStore((s) => s.markRegistered);

  return useMutation({
    mutationFn: async () => {
      // For sample tournaments, simulate registration locally
      if (isSampleTournament(id)) {
        const sample = getSampleTournamentDetail(id);
        const fee = sample?.tournament.entryFee ?? 0;
        const newBalance = Math.max(0, getBalance - fee);
        return {
          success: true,
          entryFeePaid: fee,
          registrationId: `sample-reg-${Date.now()}`,
          newBalance,
          message: "Registered successfully (sample)",
        };
      }
      return registerForTournament(id);
    },
    onSuccess: (data) => {
      setBalance(data.newBalance);
      markRegistered(id);
      qc.invalidateQueries({ queryKey: TOURNAMENT_KEYS.detail(id) });
      qc.invalidateQueries({ queryKey: TOURNAMENT_KEYS.list({}) });
    },
  });
}

export function useUnregisterTournament(id: string) {
  const qc = useQueryClient();
  const setBalance = useChutaWalletStore((s) => s.setBalance);
  const getBalance = useChutaWalletStore((s) => s.balance);
  const markUnregistered = useTournamentStore((s) => s.markUnregistered);

  return useMutation({
    mutationFn: async () => {
      // For sample tournaments, simulate unregistration locally
      if (isSampleTournament(id)) {
        const sample = getSampleTournamentDetail(id);
        const refund = sample?.tournament.entryFee ?? 0;
        const newBalance = getBalance + refund;
        return {
          success: true,
          refundAmount: refund,
          newBalance,
          message: "Unregistered successfully (sample)",
        };
      }
      return unregisterFromTournament(id);
    },
    onSuccess: (data) => {
      setBalance(data.newBalance);
      markUnregistered(id);
      qc.invalidateQueries({ queryKey: TOURNAMENT_KEYS.detail(id) });
      qc.invalidateQueries({ queryKey: TOURNAMENT_KEYS.list({}) });
    },
  });
}
