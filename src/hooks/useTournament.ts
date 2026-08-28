import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  getTournaments,
  getTournamentDetail,
  getTournamentLeaderboard,
  registerForTournament,
  unregisterFromTournament,
  forfeitTournament,
  proposeTournament,
  getMyTournaments,
  getRoundDetail,
  type GetTournamentsParams,
  type ProposeTournamentPayload,
} from "@/lib/api/tournament";
import { useChutaWalletStore } from "@/store/chutaWalletStore";
import { CHUTA_KEYS } from "@/hooks/useChutaWallet";
import { useTournamentStore } from "@/store/tournamentStore";

export const TOURNAMENT_KEYS = {
  list:        (p: GetTournamentsParams) => ["tournaments", "list", p] as const,
  detail:      (id: string)             => ["tournaments", "detail", id] as const,
  leaderboard: (id: string)             => ["tournaments", "leaderboard", id] as const,
  mine:        (page: number)           => ["tournaments", "mine", page] as const,
  round:       (id: string, n: number)  => ["tournaments", "round", id, n] as const,
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
    queryFn: () => getTournamentDetail(id),
    enabled: !!id,
    staleTime: 30_000,
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
  const markRegistered = useTournamentStore((s) => s.markRegistered);

  return useMutation({
    mutationFn: () => registerForTournament(id),
    onSuccess: (data) => {
      // The register endpoint returns { success, entryFeePaid, registrationId }
      // — it does NOT return newBalance, despite the old type claiming it did.
      // Blindly calling setBalance(data.newBalance) wrote `undefined` into the
      // wallet store, and TopBar's `zetaPoints.toLocaleString()` then threw,
      // unmounting the whole app to a blank screen. Only trust a real number,
      // and otherwise refetch the balance from its own endpoint.
      if (typeof data.newBalance === "number" && Number.isFinite(data.newBalance)) {
        setBalance(data.newBalance);
      } else {
        qc.invalidateQueries({ queryKey: CHUTA_KEYS.balance });
      }
      markRegistered(id);
      qc.invalidateQueries({ queryKey: TOURNAMENT_KEYS.detail(id) });
      qc.invalidateQueries({ queryKey: ["tournaments", "list"] });
      qc.invalidateQueries({ queryKey: ["tournaments", "mine"] });
    },
  });
}

export function useUnregisterTournament(id: string) {
  const qc = useQueryClient();
  const setBalance = useChutaWalletStore((s) => s.setBalance);
  const markUnregistered = useTournamentStore((s) => s.markUnregistered);

  return useMutation({
    mutationFn: () => unregisterFromTournament(id),
    onSuccess: (data) => {
      // Same as register above — the endpoint returns { success, refundAmount },
      // with no newBalance. See the note there.
      if (typeof data.newBalance === "number" && Number.isFinite(data.newBalance)) {
        setBalance(data.newBalance);
      } else {
        qc.invalidateQueries({ queryKey: CHUTA_KEYS.balance });
      }
      markUnregistered(id);
      qc.invalidateQueries({ queryKey: TOURNAMENT_KEYS.detail(id) });
      qc.invalidateQueries({ queryKey: ["tournaments", "list"] });
      qc.invalidateQueries({ queryKey: ["tournaments", "mine"] });
    },
  });
}

export function useForfeitTournament() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => forfeitTournament(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: TOURNAMENT_KEYS.detail(id) });
      qc.invalidateQueries({ queryKey: TOURNAMENT_KEYS.leaderboard(id) });
      qc.invalidateQueries({ queryKey: ["tournaments", "mine"] });
    },
  });
}

export function useProposeTournament() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProposeTournamentPayload) => proposeTournament(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tournaments", "mine"] });
    },
  });
}

export function useMyTournaments(page = 1, limit = 20) {
  return useQuery({
    queryKey: TOURNAMENT_KEYS.mine(page),
    queryFn: () => getMyTournaments(page, limit),
    staleTime: 15_000,
  });
}

/**
 * Round detail — questions, standings, and `myEntry.answers`, the list of
 * questions this participant has already answered. That last field is what
 * lets gameplay resume mid-round after a refresh or reconnect instead of
 * restarting from question one and colliding with answers the server has
 * already recorded.
 */
export function useTournamentRound(
  tournamentId: string,
  roundNumber: number,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: TOURNAMENT_KEYS.round(tournamentId, roundNumber),
    queryFn: () => getRoundDetail(tournamentId, roundNumber),
    enabled: (options?.enabled ?? true) && !!tournamentId && roundNumber > 0,
    staleTime: 0,
    gcTime: 0,
  });
}
