import apiClient from "./client";

// ── Types ─────────────────────────────────────────────────────────────────────

export type TournamentStatus = "open" | "in_progress" | "completed";
export type TournamentFormat = "speed_run" | "classic" | "knockout" | "battle_royale";

export const FORMAT_LABELS: Record<TournamentFormat, string> = {
  speed_run:     "Speed Run",
  classic:       "Classic",
  knockout:      "Knockout",
  battle_royale: "Battle Royale",
};

export const FORMAT_COLORS: Record<TournamentFormat, string> = {
  battle_royale: "bg-red-500/20 text-red-400 border border-red-500/30",
  speed_run:     "bg-orange-500/20 text-orange-400 border border-orange-500/30",
  knockout:      "bg-muted text-foreground border border-border",
  classic:       "bg-green-500/20 text-green-400 border border-green-500/30",
};

export interface PrizeDistribution {
  first: number;
  second: number;
  third: number;
}

export interface Tournament {
  id: string;
  name: string;
  description: string;
  format: TournamentFormat;
  entryFee: number;
  prizeDistribution: PrizeDistribution;
  categoryId: string;
  categoryName: string;
  maxParticipants: number;
  currentParticipants: number;
  prizePool: number;
  registrationDeadline: string;
  startTime: string;
  status: TournamentStatus;
  createdBy: number;
}

export interface TournamentDetail extends Tournament {
  minParticipants: number;
  currentRound: number;
  totalRounds: number;
  participants: unknown[];
  createdAt: string;
}

export interface GetTournamentsParams {
  status?: TournamentStatus;
  format?: TournamentFormat;
  page?: number;
  limit?: number;
}

export interface GetTournamentsResponse {
  success: boolean;
  tournaments: Tournament[];
  totalCount: number;
}

export interface GetTournamentDetailResponse {
  success: boolean;
  tournament: TournamentDetail;
  participantCount: number;
  prizePool: number;
  participantsHidden: boolean;
}

export interface RegisterResponse {
  success: boolean;
  entryFeePaid: number;
  registrationId: string;
  newBalance: number;
  message: string;
}

export interface UnregisterResponse {
  success: boolean;
  refundAmount: number;
  newBalance: number;
  message: string;
}

export interface TournamentParticipant {
  userId: number;
  username: string;
  currentRound: number;
  totalScore: number;
  averageTime: number;
  status: "active" | "eliminated";
  placement: number;
}

export interface TournamentLeaderboardResponse {
  success: boolean;
  participants: TournamentParticipant[];
  currentRound: number;
  totalRounds: number;
}

// ── API functions ─────────────────────────────────────────────────────────────

export const getTournaments = async (
  params: GetTournamentsParams = {}
): Promise<GetTournamentsResponse> => {
  const res = await apiClient.get<GetTournamentsResponse>("/api/quiz/tournaments", {
    params: { page: 1, limit: 20, ...params },
  });
  return res.data;
};

export const getTournamentDetail = async (
  id: string
): Promise<GetTournamentDetailResponse> => {
  const res = await apiClient.get<GetTournamentDetailResponse>(`/api/quiz/tournament/${id}`);
  return res.data;
};

export const registerForTournament = async (id: string): Promise<RegisterResponse> => {
  const res = await apiClient.post<RegisterResponse>(`/api/quiz/tournament/${id}/register`);
  return res.data;
};

export const unregisterFromTournament = async (id: string): Promise<UnregisterResponse> => {
  const res = await apiClient.post<UnregisterResponse>(`/api/quiz/tournament/${id}/unregister`);
  return res.data;
};

export const getTournamentLeaderboard = async (
  id: string
): Promise<TournamentLeaderboardResponse> => {
  const res = await apiClient.get<TournamentLeaderboardResponse>(
    `/api/quiz/tournament/${id}/leaderboard`
  );
  return res.data;
};
