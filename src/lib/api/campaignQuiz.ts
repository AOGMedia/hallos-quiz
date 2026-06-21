import axios from "axios";
import { getToken } from "@/store/authStore";

// Dedicated client so 401s redirect back to the hallos.net campaign page
// (not the generic dashboard), allowing the user to re-auth and return with a fresh JWT.
const campaignClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

campaignClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

campaignClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message ?? error.message ?? "Request failed";

    if (status === 401) {
      sessionStorage.removeItem("auth_token");
      const token = sessionStorage.getItem("campaign_token") ?? "";
      const redirectUrl = token
        ? encodeURIComponent(`https://www.hallos.quiz/campaign/quiz?token=${token}`)
        : encodeURIComponent("https://www.hallos.net/dashboard/games");
      window.location.href = `https://www.hallos.net/signin?redirect=${redirectUrl}`;
      return new Promise(() => {});
    }

    return Promise.reject(new Error(message));
  }
);

export type CampaignQuizStatusType = "pending" | "active" | "completed";

export interface CampaignStatusResponse {
  success: true;
  status: CampaignQuizStatusType;
  tokenExpiresAt?: string;
  startedAt?: string;
  answersSubmitted?: number;
  totalQuestions?: number;
  secondsPerQuestion?: number;
  score?: number;
  totalCorrect?: number;
  totalTimeMs?: number;
  completedAt?: string;
}

export interface CampaignQuestion {
  questionIndex: number;
  questionId: string;
  questionText: string;
  shuffledOptions: Record<"a" | "b" | "c" | "d" | "e", string>;
}

export interface CampaignStartResponse {
  success: true;
  sessionId: string;
  startedAt: string;
  status: "active";
  secondsPerQuestion: number;
  totalQuestions: number;
  maxDurationSeconds: number;
  questions: CampaignQuestion[];
}

export interface CampaignAnswerResponse {
  success: true;
  message: string;
  answersSubmitted: number;
  totalQuestions: number;
  timedOut: boolean;
}

export interface CampaignSubmitResponse {
  success: true;
  message: string;
  score: number;
  totalCorrect: number;
  totalQuestions: number;
  totalTimeMs: number;
}

export const getCampaignQuizStatus = (token: string) =>
  campaignClient
    .get<CampaignStatusResponse>(`/api/campaigns/quiz/${token}/status`)
    .then((r) => r.data);

export const startCampaignQuiz = (token: string) =>
  campaignClient
    .get<CampaignStartResponse>(`/api/campaigns/quiz/${token}/start`)
    .then((r) => r.data);

export const submitCampaignAnswer = (
  token: string,
  payload: {
    questionId: string;
    questionIndex: number;
    selectedAnswer: string;
    clientTimestamp: number;
  }
) =>
  campaignClient
    .post<CampaignAnswerResponse>(`/api/campaigns/quiz/${token}/answer`, payload)
    .then((r) => r.data);

export const submitCampaignQuiz = (token: string) =>
  campaignClient
    .post<CampaignSubmitResponse>(`/api/campaigns/quiz/${token}/submit`)
    .then((r) => r.data);
