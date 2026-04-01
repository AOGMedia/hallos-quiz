import apiClient from "./client";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ChallengeStatus = "pending" | "accepted" | "declined" | "expired" | "active";

export interface CreateChallengePayload {
  wagerAmount: number;
  categoryId: string;
  opponentId?: number | null;
}

export interface CreateChallengeResponse {
  success: boolean;
  challengeId: string;
  status: ChallengeStatus;
  escrowAmount: number;
  expiresAt: string;
}

export interface ChallengeParticipant {
  userId: number;
  score: number;
  status: string;
  wagerAmount: number;
  answers: unknown[];
}

export interface Challenge {
  id: string;
  creatorId: number;
  creatorUsername: string;
  challengerNickname?: string;
  challengerAvatar?: string;
  challengerWins?: number;
  challengerLosses?: number;
  opponentId: number | null;
  wagerAmount: number;
  categoryId: string;
  categoryName: string;
  status: ChallengeStatus;
  createdAt: string;
  expiresAt: string;
}

export interface GetChallengesParams {
  status?: ChallengeStatus;
  page?: number;
  limit?: number;
}

export interface GetChallengesResponse {
  success: boolean;
  challenges: Challenge[];
  totalCount: number;
}

export interface MatchQuestion {
  id: string;
  questionText: string;
  options: Record<string, string>; // { a: "...", b: "...", c: "...", d: "..." }
}

export interface AcceptChallengeResponse {
  success: boolean;
  matchId: string;
  challengerId?: number;
  startTime: string;
  questions: MatchQuestion[];
  challenger?: {
    userId: number;
    nickname: string;
    avatarUrl: string;
  };
}

export interface DeclineChallengeResponse {
  success: boolean;
  refundAmount: number;
  message: string;
}

export interface CounterOfferPayload {
  newWagerAmount: number;
}

export interface CounterOfferResponse {
  success: boolean;
  counterOfferId: string;
  newWagerAmount: number;
  message: string;
}

export interface MatchParticipant {
  userId: number;
  username: string;
  wagerAmount: number;
  score: number;
  completionTime: number;
  status: string;
}

export interface Match {
  id: string;
  matchType: string;
  status: string;
  winnerId?: number | null;
  challengerId?: number;
  participants: MatchParticipant[];
  questions: MatchQuestion[];
  startedAt: string;
}

export interface GetMatchResponse {
  success: boolean;
  match: Match;
}

export interface ForfeitMatchResponse {
  success: boolean;
  penaltyAmount: number;
  winnerId: number;
  message: string;
}

export interface LobbyPlayer {
  userId: number;
  nickname: string;
  avatarUrl: string;
  wins: number;
  losses: number;
  winRate: number;
  chutaBalance?: number;
  totalWinnings?: number;
  isOnline?: boolean;
}

export interface GetLobbyPlayersParams {
  page?: number;
  limit?: number;
}

export interface GetLobbyPlayersResponse {
  success: boolean;
  players: LobbyPlayer[];
  total: number;
  page: number;
  totalPages: number;
}

// ── Categories ────────────────────────────────────────────────────────────────

export interface QuizCategory {
  id: string;
  name: string;
  description?: string;
  questionCount?: number;
}

export interface GetCategoriesResponse {
  success: boolean;
  categories: QuizCategory[];
}

export const fetchCategories = async (): Promise<GetCategoriesResponse> => {
  const res = await apiClient.get<GetCategoriesResponse>("/api/quiz/categories");
  return res.data;
};

export const fetchLobbyPlayers = async (
  params: GetLobbyPlayersParams = {}
): Promise<GetLobbyPlayersResponse> => {
  const res = await apiClient.get<GetLobbyPlayersResponse>("/api/quiz/lobby/players", {
    params: { page: 1, limit: 12, ...params },
  });
  return res.data;
};


export const createChallenge = async (
  payload: CreateChallengePayload
): Promise<CreateChallengeResponse> => {
  const res = await apiClient.post<CreateChallengeResponse>(
    "/api/quiz/lobby/challenge/create",
    payload
  );
  return res.data;
};

export const getChallenges = async (
  params: GetChallengesParams = {}
): Promise<GetChallengesResponse> => {
  const res = await apiClient.get<GetChallengesResponse>("/api/quiz/lobby/challenges", {
    params: { status: "pending", page: 1, limit: 20, ...params },
  });
  return res.data;
};

export const acceptChallenge = async (id: string): Promise<AcceptChallengeResponse> => {
  const res = await apiClient.post<AcceptChallengeResponse>(
    `/api/quiz/lobby/challenge/${id}/accept`
  );
  return res.data;
};

export const declineChallenge = async (id: string): Promise<DeclineChallengeResponse> => {
  const res = await apiClient.post<DeclineChallengeResponse>(
    `/api/quiz/lobby/challenge/${id}/decline`
  );
  return res.data;
};

export const counterOffer = async (
  id: string,
  payload: CounterOfferPayload
): Promise<CounterOfferResponse> => {
  const res = await apiClient.post<CounterOfferResponse>(
    `/api/quiz/lobby/challenge/${id}/counter`,
    payload
  );
  return res.data;
};

export const getMatch = async (id: string): Promise<GetMatchResponse> => {
  const res = await apiClient.get<GetMatchResponse>(`/api/quiz/lobby/match/${id}`);
  return res.data;
};

export const forfeitMatch = async (id: string): Promise<ForfeitMatchResponse> => {
  const res = await apiClient.post<ForfeitMatchResponse>(
    `/api/quiz/lobby/match/${id}/forfeit`
  );
  return res.data;
};

export const cancelChallenge = async (id: string): Promise<DeclineChallengeResponse> => {
  const res = await apiClient.post<DeclineChallengeResponse>(
    `/api/quiz/lobby/challenge/${id}/cancel`
  );
  return res.data;
};

export const getActiveMatch = async (): Promise<{ success: boolean; match: AcceptChallengeResponse | null }> => {
  const res = await apiClient.get<{ success: boolean; match: AcceptChallengeResponse | null }>(
    "/api/quiz/lobby/active-match"
  );
  return res.data;
};
