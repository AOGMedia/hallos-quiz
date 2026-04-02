import apiClient from "./client";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GlobalRankingEntry {
  rank: number;
  userId: number;
  nickname: string;
  username?: string;
  avatarUrl?: string | null;
  totalWinnings: number;
  lobbyWinnings: number;
  tournamentPrizes: number;
  lobbyStats: {
    matches: number;
    wins: number;
    winRate: number;
  };
  tournamentStats: {
    entered: number;
    won: number;
    top3: number;
  };
}

export interface GlobalLeaderboardResponse {
  success: boolean;
  rankings: GlobalRankingEntry[];
  userRank: number;
  totalPlayers: number;
}

export interface LobbyRankingEntry {
  rank: number;
  userId: number;
  nickname: string;
  username?: string;
  avatarUrl?: string | null;
  totalWinnings: number;
  matches: number;
  wins: number;
  winRate: number;
}

export interface LobbyLeaderboardResponse {
  success: boolean;
  rankings: LobbyRankingEntry[];
}

export interface TournamentRankingEntry {
  rank: number;
  userId: number;
  nickname: string;
  username?: string;
  avatarUrl?: string | null;
  totalPrizeMoney: number;
  tournamentsEntered: number;
  tournamentsWon: number;
  top3Finishes: number;
}

export interface TournamentLeaderboardResponse {
  success: boolean;
  rankings: TournamentRankingEntry[];
}

export interface ActiveUsersResponse {
  success: boolean;
  count: number;
  timestamp: number;
}

export interface LeaderboardParams {
  page?: number;
  limit?: number;
}

// ── API functions ─────────────────────────────────────────────────────────────

export const getGlobalLeaderboard = async (
  params: LeaderboardParams = {}
): Promise<GlobalLeaderboardResponse> => {
  const res = await apiClient.get<GlobalLeaderboardResponse>(
    "/api/quiz/leaderboard/global",
    { params: { page: 1, limit: 50, ...params } }
  );
  return res.data;
};

export const getLobbyLeaderboard = async (
  params: LeaderboardParams = {}
): Promise<LobbyLeaderboardResponse> => {
  const res = await apiClient.get<LobbyLeaderboardResponse>(
    "/api/quiz/leaderboard/lobby",
    { params: { page: 1, limit: 50, ...params } }
  );
  return res.data;
};

export const getTournamentLeaderboard = async (
  params: LeaderboardParams = {}
): Promise<TournamentLeaderboardResponse> => {
  const res = await apiClient.get<TournamentLeaderboardResponse>(
    "/api/quiz/leaderboard/tournament",
    { params: { page: 1, limit: 50, ...params } }
  );
  return res.data;
};

export const getActiveUsers = async (): Promise<ActiveUsersResponse> => {
  const res = await apiClient.get<ActiveUsersResponse>("/api/quiz/active-users");
  return res.data;
};
