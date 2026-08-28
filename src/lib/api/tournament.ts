import apiClient from "./client";

// ── Types ─────────────────────────────────────────────────────────────────────

export type TournamentStatus =
  | "draft"
  | "pending_review"
  | "open"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "rejected";
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
  maxParticipants: number | null; // null = unlimited
  /** Below this at start time the tournament auto-cancels and refunds. */
  minParticipants?: number;
  currentParticipants: number;
  prizePool: number;
  registrationDeadline: string;
  startTime: string;
  status: TournamentStatus;
  createdBy: number;
  proposedBy?: number | null;
  /** Set once an admin reviews a user-hosted proposal */
  reviewedAt?: string | null;
  rejectionReason?: string | null;
}

/** A registered entrant, as returned on the tournament detail payload */
export interface TournamentDetailParticipant {
  userId: number;
  nickname?: string | null;
  avatarUrl?: string | null;
  status: "registered" | "active" | "eliminated" | "winner";
  currentRound?: number;
  totalScore?: number;
}

export interface TournamentDetail extends Tournament {
  minParticipants: number;
  currentRound: number;
  totalRounds: number;
  /** Empty until the tournament starts — see `participantsHidden` on the response */
  participants: TournamentDetailParticipant[];
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
  page: number;
  totalPages: number;
}

export interface GetTournamentDetailResponse {
  success: boolean;
  tournament: TournamentDetail;
  participantCount: number;
  prizePool: number;
  participantsHidden: boolean;
  /** Authoritative — the participants array is blanked for privacy before the
   *  tournament starts, so registration can't be derived from it client-side. */
  isRegistered: boolean;
}

/* The register/unregister endpoints return only the fields marked required
 * below — `newBalance` and `message` were previously declared as required but
 * are never sent, so consumers must treat them as optional and fall back to
 * refetching the balance. See useTournament.ts. */
export interface RegisterResponse {
  success: boolean;
  entryFeePaid: number;
  registrationId: string;
  newBalance?: number;
  message?: string;
}

export interface UnregisterResponse {
  success: boolean;
  refundAmount: number;
  newBalance?: number;
  message?: string;
}

export interface TournamentParticipant {
  userId: number;
  nickname: string;
  avatarUrl: string | null;
  currentRound: number;
  totalScore: number;
  averageTime: number | null;
  status: "registered" | "active" | "eliminated" | "winner";
  /** Live 1-indexed standing — always present, updates every round */
  rank: number;
  /** Final placement — null until the tournament actually completes and pays out */
  placement: number | null;
  prizeWon: number;
}

export interface TournamentLeaderboardResponse {
  success: boolean;
  participants: TournamentParticipant[];
  currentRound: number;
  totalRounds: number;
  status: TournamentStatus;
}

export interface ProposeTournamentPayload {
  name: string;
  description?: string;
  format: TournamentFormat;
  entryFee: number;
  categoryId: string;
  maxParticipants?: number;
  minParticipants?: number;
  registrationDeadline: string;
  startTime: string;
  prizeDistribution?: PrizeDistribution;
}

export interface ProposeTournamentResponse {
  success: boolean;
  tournamentId: string;
  tournament: Tournament;
}

export interface MyTournamentParticipation {
  tournamentId: string;
  tournament: Tournament;
  status: "registered" | "active" | "eliminated" | "winner";
  currentRound: number;
  totalScore: number;
  placement: number | null;
  prizeWon: number;
  registeredAt: string;
}

export interface MyTournamentsResponse {
  success: boolean;
  participations: MyTournamentParticipation[];
  proposals: Tournament[];
}

export interface RoundDetailResponse {
  success: boolean;
  round: {
    roundNumber: number;
    status: "pending" | "active" | "completed";
    questions: Array<{ id: string; questionText: string; options: Record<string, string>; difficulty?: string }>;
    participants: Array<{ userId: number; score: number; completionTime: number | null; rank: number | null; matchId?: string; bye?: boolean; answers?: string[] }>;
    startedAt: string | null;
    completedAt: string | null;
  };
  myEntry: { userId: number; score: number; completionTime: number | null; rank: number | null; answers?: string[] } | null;
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

export interface ForfeitTournamentResponse {
  success: boolean;
}

export const forfeitTournament = async (id: string): Promise<ForfeitTournamentResponse> => {
  const res = await apiClient.post<ForfeitTournamentResponse>(`/api/quiz/tournament/${id}/forfeit`);
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

export const proposeTournament = async (
  payload: ProposeTournamentPayload
): Promise<ProposeTournamentResponse> => {
  const res = await apiClient.post<ProposeTournamentResponse>("/api/quiz/tournament/propose", payload);
  return res.data;
};

export const getMyTournaments = async (
  page = 1,
  limit = 20
): Promise<MyTournamentsResponse> => {
  const res = await apiClient.get<MyTournamentsResponse>("/api/quiz/tournament/mine", {
    params: { page, limit },
  });
  return res.data;
};

export const getRoundDetail = async (
  tournamentId: string,
  roundNumber: number
): Promise<RoundDetailResponse> => {
  const res = await apiClient.get<RoundDetailResponse>(
    `/api/quiz/tournament/${tournamentId}/round/${roundNumber}`
  );
  return res.data;
};
