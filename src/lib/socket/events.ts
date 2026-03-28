import { getSocket } from "./socket";

export interface MatchStartedPayload {
  matchId: string;
  question: {
    id: string;
    text: string;
    options: { label: string; value: string }[];
    isBonus?: boolean;
  };
  timeLimit: number;
}

export interface AnswerRecordedPayload {
  questionId: string;
  success?: boolean;
  correct?: boolean;
  isCorrect?: boolean;
  correctAnswer?: string;
  pointsEarned?: number;
  responseTime?: number;
}

export interface OpponentProgressPayload {
  opponentId: string;
  score: number;
  answeredCorrectly: boolean;
  answersCount?: number;
  totalQuestions?: number;
}

export interface MatchEndedPayload {
  winnerId: string;
  player1Score: number;
  player2Score: number;
  totalTime: number;
}

export interface MatchEventHandlers {
  onMatchStarted: (data: MatchStartedPayload) => void;
  onAnswerRecorded: (data: AnswerRecordedPayload) => void;
  onOpponentProgress: (data: OpponentProgressPayload) => void;
  onMatchEnded: (data: MatchEndedPayload) => void;
  onError: (err: { message: string }) => void;
}

export const attachMatchEvents = (handlers: MatchEventHandlers): void => {
  const socket = getSocket();
  socket.on("match_started", handlers.onMatchStarted);
  socket.on("answer_recorded", handlers.onAnswerRecorded);
  socket.on("opponent_progress", handlers.onOpponentProgress);
  socket.on("match_ended", handlers.onMatchEnded);
  socket.on("error", handlers.onError);
};

export const detachMatchEvents = (): void => {
  const socket = getSocket();
  socket.off("match_started");
  socket.off("answer_recorded");
  socket.off("opponent_progress");
  socket.off("match_ended");
  socket.off("error");
};

// ── Lobby events ──────────────────────────────────────────────────────────────

export interface PlayersUpdatedPayload {
  onlineCount: number;
  timestamp: string;
}

export const onPlayersUpdated = (cb: (data: PlayersUpdatedPayload) => void): void => {
  getSocket().on("players_updated", cb);
};

export const offPlayersUpdated = (): void => {
  getSocket().off("players_updated");
};

// ── Incoming challenge event ──────────────────────────────────────────────────

export interface IncomingChallengePayload {
  challengeId: string;
  challenger: {
    userId: number;
    nickname: string;
    avatarUrl: string;
    chutaBalance: number;
  };
  categoryName: string;
  wagerAmount: number;
  expiresAt: string;
}

export const onIncomingChallenge = (cb: (data: IncomingChallengePayload) => void): void => {
  getSocket().on("challenge_received", cb);
};

export const offIncomingChallenge = (): void => {
  getSocket().off("challenge_received");
};

// ── Challenge lifecycle events ────────────────────────────────────────────────

export interface ChallengeAcceptedPayload {
  challengeId: string;
  matchId: string;
  startTime: string;
  questions: Array<{
    id: string;
    questionText: string;
    options: Record<string, string>;
  }>;
  opponent: {
    userId: number;
    nickname: string;
    avatarUrl: string;
  };
}

export interface ChallengeDeclinedPayload {
  challengeId: string;
  refundAmount: number;
}

export interface ChallengeTimeoutPayload {
  challengeId: string;
}

export interface ChallengeCounterPayload {
  challengeId: string;
  newWagerAmount: number;
  opponentNickname: string;
}

export const onChallengeAccepted = (cb: (data: ChallengeAcceptedPayload) => void): void => {
  getSocket().on("challenge_accepted", cb);
};
export const offChallengeAccepted = (): void => {
  getSocket().off("challenge_accepted");
};

export const onChallengeDeclined = (cb: (data: ChallengeDeclinedPayload) => void): void => {
  getSocket().on("challenge_declined", cb);
};
export const offChallengeDeclined = (): void => {
  getSocket().off("challenge_declined");
};

export const onChallengeTimeout = (cb: (data: ChallengeTimeoutPayload) => void): void => {
  getSocket().on("challenge_timeout", cb);
};
export const offChallengeTimeout = (): void => {
  getSocket().off("challenge_timeout");
};

export const onChallengeCounter = (cb: (data: ChallengeCounterPayload) => void): void => {
  getSocket().on("challenge_counter", cb);
};
export const offChallengeCounter = (): void => {
  getSocket().off("challenge_counter");
};
