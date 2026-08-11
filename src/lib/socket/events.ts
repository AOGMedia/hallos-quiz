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
  // opponent_progress is handled by Gameplay's persistent listener
  socket.on("match_ended", handlers.onMatchEnded);
  socket.on("error", handlers.onError);
};

export const detachMatchEvents = (): void => {
  const socket = getSocket();
  socket.off("match_started");
  socket.off("answer_recorded");
  // opponent_progress is managed by Gameplay's persistent listener — don't remove it here
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
  challengerId?: number;
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
  /** Present when this match is a tournament knockout pairing, not a 1v1 lobby challenge */
  tournamentId?: string;
  roundNumber?: number;
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

export const onMatchStateRestored = (cb: (data: ChallengeAcceptedPayload) => void): void => {
  getSocket().on("match_state_restored", cb);
};
export const offMatchStateRestored = (): void => {
  getSocket().off("match_state_restored");
};

// ── Tournament events ──────────────────────────────────────────────────────────
// Knockout format reuses the match events above (challenge_accepted, answer_recorded,
// match_ended) via real QuizMatch rows — these are only for classic/speed_run/battle_royale
// (shared-question-set rounds) plus tournament-wide lifecycle notifications.

export interface TournamentJoinedPayload {
  tournamentId: string;
  timestamp: number;
}

export const onTournamentJoined = (cb: (data: TournamentJoinedPayload) => void): void => {
  getSocket().on("tournament_joined", cb);
};
export const offTournamentJoined = (): void => {
  getSocket().off("tournament_joined");
};

export interface RoundQuestion {
  id: string;
  questionText: string;
  options: Record<string, string>;
  difficulty?: string;
}

export interface RoundStartedPayload {
  tournamentId: string;
  roundNumber: number;
  format: "classic" | "speed_run" | "battle_royale" | "knockout";
  questions?: RoundQuestion[]; // present for shared-question formats
  matchCount?: number;        // present for knockout
  byeUserId?: number | null;  // present for knockout
  startTime?: string;
}

export const onRoundStarted = (cb: (data: RoundStartedPayload) => void): void => {
  getSocket().on("round_started", cb);
};
export const offRoundStarted = (): void => {
  getSocket().off("round_started");
};

export interface RoundResultEntry {
  userId: number;
  score: number;
  completionTime: number | null;
  rank: number | null;
  matchId?: string;
  bye?: boolean;
}

export interface RoundEndedPayload {
  tournamentId: string;
  roundNumber: number;
  results: RoundResultEntry[];
  timestamp: number;
}

export const onRoundEnded = (cb: (data: RoundEndedPayload) => void): void => {
  getSocket().on("round_ended", cb);
};
export const offRoundEnded = (): void => {
  getSocket().off("round_ended");
};

export interface TournamentStartedPayload {
  tournamentId: string;
  format: string;
  participantCount: number;
  totalRounds: number;
  startTime: string;
  timestamp: number;
}

export const onTournamentStarted = (cb: (data: TournamentStartedPayload) => void): void => {
  getSocket().on("tournament_started", cb);
};
export const offTournamentStarted = (): void => {
  getSocket().off("tournament_started");
};

export interface TournamentPlacement {
  userId: number;
  placement: number;
  prizeWon: number;
}

export interface TournamentEndedPayload {
  tournamentId: string;
  winnerId: number | null;
  placements: TournamentPlacement[];
  timestamp: number;
  // Direct-to-user variant (emitted to each placed participant individually)
  placement?: number;
  prizeWon?: number;
}

export const onTournamentEnded = (cb: (data: TournamentEndedPayload) => void): void => {
  getSocket().on("tournament_ended", cb);
};
export const offTournamentEnded = (): void => {
  getSocket().off("tournament_ended");
};

export interface ParticipantForfeitedPayload {
  tournamentId: string;
  userId: number;
  reason?: string;
  timestamp: number;
}

export const onParticipantForfeited = (cb: (data: ParticipantForfeitedPayload) => void): void => {
  getSocket().on("participant_forfeited", cb);
};
export const offParticipantForfeited = (): void => {
  getSocket().off("participant_forfeited");
};

export interface TournamentByePayload {
  tournamentId: string;
  roundNumber: number;
}

export const onTournamentBye = (cb: (data: TournamentByePayload) => void): void => {
  getSocket().on("tournament_bye", cb);
};
export const offTournamentBye = (): void => {
  getSocket().off("tournament_bye");
};

export interface TournamentAnswerRecordedPayload {
  questionId: string;
  success: boolean;
  correct?: boolean;
  correctAnswer?: string;
  pointsEarned?: number;
  responseTime?: number;
}

export const onTournamentAnswerRecorded = (cb: (data: TournamentAnswerRecordedPayload) => void): void => {
  getSocket().on("tournament_answer_recorded", cb);
};
export const offTournamentAnswerRecorded = (): void => {
  getSocket().off("tournament_answer_recorded");
};

export interface TournamentProposalReviewedPayload {
  tournamentId: string;
  reason?: string | null;
}

export const onTournamentProposalApproved = (cb: (data: TournamentProposalReviewedPayload) => void): void => {
  getSocket().on("tournament_proposal_approved", cb);
};
export const offTournamentProposalApproved = (): void => {
  getSocket().off("tournament_proposal_approved");
};

export const onTournamentProposalRejected = (cb: (data: TournamentProposalReviewedPayload) => void): void => {
  getSocket().on("tournament_proposal_rejected", cb);
};
export const offTournamentProposalRejected = (): void => {
  getSocket().off("tournament_proposal_rejected");
};
