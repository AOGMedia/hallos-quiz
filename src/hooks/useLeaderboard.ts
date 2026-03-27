import { useQuery } from "@tanstack/react-query";
import {
  getGlobalLeaderboard,
  getLobbyLeaderboard,
  getTournamentLeaderboard,
  getActiveUsers,
  type LeaderboardParams,
} from "@/lib/api/leaderboard";

export const LEADERBOARD_KEYS = {
  global:     (p: LeaderboardParams) => ["leaderboard", "global", p] as const,
  lobby:      (p: LeaderboardParams) => ["leaderboard", "lobby", p] as const,
  tournament: (p: LeaderboardParams) => ["leaderboard", "tournament", p] as const,
  activeUsers: ["leaderboard", "active-users"] as const,
};

export function useGlobalLeaderboard(params: LeaderboardParams = {}) {
  return useQuery({
    queryKey: LEADERBOARD_KEYS.global(params),
    queryFn: () => getGlobalLeaderboard(params),
    staleTime: 60_000,
  });
}

export function useLobbyLeaderboard(params: LeaderboardParams = {}) {
  return useQuery({
    queryKey: LEADERBOARD_KEYS.lobby(params),
    queryFn: () => getLobbyLeaderboard(params),
    staleTime: 60_000,
  });
}

export function useTournamentLeaderboard(params: LeaderboardParams = {}) {
  return useQuery({
    queryKey: LEADERBOARD_KEYS.tournament(params),
    queryFn: () => getTournamentLeaderboard(params),
    staleTime: 60_000,
  });
}

export function useActiveUsers() {
  return useQuery({
    queryKey: LEADERBOARD_KEYS.activeUsers,
    queryFn: getActiveUsers,
    staleTime: 30_000,
    refetchInterval: 30_000, // poll every 30s — no auth required
  });
}
