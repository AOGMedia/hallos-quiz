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
  correct: boolean;
  correctAnswer: string;
  pointsEarned: number;
}

export interface OpponentProgressPayload {
  opponentId: string;
  score: number;
  answeredCorrectly: boolean;
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

export const attachMatchEvents = (
  token: string,
  handlers: MatchEventHandlers
): void => {
  const socket = getSocket(token);

  socket.on("match_started", handlers.onMatchStarted);
  socket.on("answer_recorded", handlers.onAnswerRecorded);
  socket.on("opponent_progress", handlers.onOpponentProgress);
  socket.on("match_ended", handlers.onMatchEnded);
  socket.on("error", handlers.onError);
};

export const detachMatchEvents = (token: string): void => {
  const socket = getSocket(token);

  socket.off("match_started");
  socket.off("answer_recorded");
  socket.off("opponent_progress");
  socket.off("match_ended");
  socket.off("error");
};
