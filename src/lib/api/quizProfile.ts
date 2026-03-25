import apiClient from "./client";

// ── Constants ─────────────────────────────────────────────────────────────────

export const DICEBEAR_STYLES = [
  "avataaars",
  "pixel-art",
  "bottts",
  "lorelei",
  "micah",
  "adventurer",
] as const;

export type DiceBearStyle = (typeof DICEBEAR_STYLES)[number];

export const getAvatarUrl = (nickname: string, style: DiceBearStyle = "avataaars"): string =>
  `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(nickname)}`;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface NicknameCheckResponse {
  success: boolean;
  available: boolean;
  nickname: string;
}

export interface RegisterQuizPayload {
  nickname: string;
  avatarUrl: string;
}

export interface RegisterQuizResponse {
  success: boolean;
  balance: number;
  nickname: string;
  avatarUrl: string;
  transaction?: Record<string, unknown>;
  message?: string;
}

export interface QuizProfile {
  userId: number;
  nickname: string;
  avatarUrl: string;
  lobbyStats: {
    totalMatches: number;
    wins: number;
    losses: number;
    winRate: number;
    totalWinnings: number;
  };
  tournamentStats: {
    tournamentsEntered: number;
    tournamentsWon: number;
    top3Finishes: number;
    totalPrizeMoney: number;
  };
  overallStats: {
    totalQuestions: number;
    correctAnswers: number;
    accuracy: number;
  };
  lastMatchAt: string | null;
  lastTournamentAt: string | null;
}

export interface QuizProfileResponse {
  success: boolean;
  profile: QuizProfile;
}

export interface UpdateProfilePayload {
  nickname?: string;
  avatarUrl?: string;
}

export interface UpdateProfileResponse {
  success: boolean;
  message: string;
  profile: {
    nickname: string;
    avatarUrl: string;
    nicknameChangedAt: string;
  };
}

// ── API functions ─────────────────────────────────────────────────────────────

export const checkNickname = async (nickname: string): Promise<NicknameCheckResponse> => {
  const res = await apiClient.get<NicknameCheckResponse>("/api/quiz/user/check-nickname", {
    params: { nickname },
  });
  return res.data;
};

export const registerQuizUser = async (
  payload: RegisterQuizPayload
): Promise<RegisterQuizResponse> => {
  const res = await apiClient.post<RegisterQuizResponse>("/api/quiz/user/register", payload);
  return res.data;
};

export const fetchQuizProfile = async (userId: number): Promise<QuizProfileResponse> => {
  const res = await apiClient.get<QuizProfileResponse>(`/api/quiz/user/profile/${userId}`);
  return res.data;
};

export const updateQuizProfile = async (
  payload: UpdateProfilePayload
): Promise<UpdateProfileResponse> => {
  const res = await apiClient.patch<UpdateProfileResponse>("/api/quiz/user/profile", payload);
  return res.data;
};
