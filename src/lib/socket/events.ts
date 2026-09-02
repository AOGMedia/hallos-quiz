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

// Deliberately no onChallengeAccepted/offChallengeAccepted helpers here.
// "challenge_accepted" has two independent consumers — Lobby.tsx (1v1
// challenges) and TournamentWatcher.tsx (knockout tournament matches) — and
// this file's off*() helpers remove ALL listeners for an event name with no
// way to scope to one caller. That combination is exactly what caused a real
// production bug: Lobby's cleanup calling the equivalent of
// `socket.off("challenge_accepted")` silently deleted TournamentWatcher's
// global listener, so tournament matches stopped navigating players into
// /game for the rest of the session. Both consumers now bind/unbind directly
// via `socket.on("challenge_accepted", handlerRef)` /
// `socket.off("challenge_accepted", handlerRef)` with their own handler
// reference instead — safe regardless of how many other listeners exist for
// the same event. Do not reintroduce a shared on/off pair for this event.

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
  /** Seconds per question, authoritative — the server scores against this window */
  timeLimit?: number;
  totalQuestions?: number;
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

// ── Scoped subscriptions ──────────────────────────────────────────────────────
// The on*/off* pairs above detach by event name, which removes *every* listener
// for that event — fine while each has a single consumer, silently destructive
// as soon as a second one appears. Everything below returns an unsubscribe that
// removes only its own handler; prefer these for new subscriptions.

export interface ParticipantEliminatedPayload {
  tournamentId: string;
  userId: number;
  roundNumber: number;
  /** 'did_not_qualify' (missed the cut) | 'bottom_tier' (battle royale cull) */
  reason?: string;
}

/**
 * Fired when a participant is knocked out. Delivered both as a room broadcast
 * (so standings refresh for everyone) and directly to the eliminated player —
 * the direct send is queued through a reconnect, so it can arrive twice. Keep
 * the handler idempotent.
 */
export const onParticipantEliminated = (
  cb: (data: ParticipantEliminatedPayload) => void
): (() => void) => {
  const socket = getSocket();
  socket.on("participant_eliminated", cb);
  return () => { socket.off("participant_eliminated", cb); };
};

export interface TournamentStateRestoredPayload {
  tournamentId: string;
  message?: string;
}

/**
 * Sent after a reconnect puts us back in a tournament room. It carries no round
 * state, so treat it as a signal to re-fetch round detail rather than a payload
 * to render.
 */
export const onTournamentStateRestored = (
  cb: (data: TournamentStateRestoredPayload) => void
): (() => void) => {
  const socket = getSocket();
  socket.on("tournament_state_restored", cb);
  return () => { socket.off("tournament_state_restored", cb); };
};

export interface ParticipantDisconnectedPayload {
  tournamentId: string;
  userId: number;
  timestamp?: number;
}

export const onRoundEndedScoped = (cb: (data: RoundEndedPayload) => void): (() => void) => {
  const socket = getSocket();
  socket.on("round_ended", cb);
  return () => { socket.off("round_ended", cb); };
};

export const onTournamentAnswerRecordedScoped = (
  cb: (data: TournamentAnswerRecordedPayload) => void
): (() => void) => {
  const socket = getSocket();
  socket.on("tournament_answer_recorded", cb);
  return () => { socket.off("tournament_answer_recorded", cb); };
};

// ── Live Now feed ─────────────────────────────────────────────────────────────
// App-wide broadcasts (io.emit) of matches in play, for the lobby's Live Now
// panel. Carry nickname/score/progress only — never question text or answers.

export interface LiveMatchPlayerPayload {
  userId: number;
  nickname: string;
  avatarUrl: string | null;
  score: number;
  answered: number;
}

export interface LiveMatchStartedPayload {
  matchId: string;
  matchType: "lobby" | "tournament";
  tournamentName: string | null;
  roundNumber: number | null;
  players: LiveMatchPlayerPayload[];
  totalQuestions: number | null;
  startedAt: number;
  updatedAt: number;
}

export interface LiveMatchProgressPayload {
  matchId: string;
  players: LiveMatchPlayerPayload[];
  totalQuestions: number | null;
}

export interface LiveMatchEndedPayload {
  matchId: string;
  winnerId: number | null;
}

export const onLiveMatchStartedScoped = (
  cb: (data: LiveMatchStartedPayload) => void
): (() => void) => {
  const socket = getSocket();
  socket.on("live_match_started", cb);
  return () => { socket.off("live_match_started", cb); };
};

export const onLiveMatchProgressScoped = (
  cb: (data: LiveMatchProgressPayload) => void
): (() => void) => {
  const socket = getSocket();
  socket.on("live_match_progress", cb);
  return () => { socket.off("live_match_progress", cb); };
};

export const onLiveMatchEndedScoped = (
  cb: (data: LiveMatchEndedPayload) => void
): (() => void) => {
  const socket = getSocket();
  socket.on("live_match_ended", cb);
  return () => { socket.off("live_match_ended", cb); };
};

// ── Challenge lifecycle, scoped ───────────────────────────────────────────────
// Scoped equivalents of the by-name on*/off* pairs above. The by-name versions
// detach EVERY listener for an event, so a component that re-registers on a
// dependency change can silently drop events during the teardown window (and
// wipe other components' listeners for the same event). Prefer these.

export const onIncomingChallengeScoped = (
  cb: (data: IncomingChallengePayload) => void
): (() => void) => {
  const socket = getSocket();
  socket.on("challenge_received", cb);
  return () => { socket.off("challenge_received", cb); };
};

export const onChallengeDeclinedScoped = (
  cb: (data: ChallengeDeclinedPayload) => void
): (() => void) => {
  const socket = getSocket();
  socket.on("challenge_declined", cb);
  return () => { socket.off("challenge_declined", cb); };
};

export const onChallengeTimeoutScoped = (
  cb: (data: ChallengeTimeoutPayload) => void
): (() => void) => {
  const socket = getSocket();
  socket.on("challenge_timeout", cb);
  return () => { socket.off("challenge_timeout", cb); };
};

export const onChallengeCounterScoped = (
  cb: (data: ChallengeCounterPayload) => void
): (() => void) => {
  const socket = getSocket();
  socket.on("challenge_counter", cb);
  return () => { socket.off("challenge_counter", cb); };
};

export const onChallengeCancelledScoped = (
  cb: (data: { challengeId: string }) => void
): (() => void) => {
  const socket = getSocket();
  socket.on("challenge_cancelled", cb);
  return () => { socket.off("challenge_cancelled", cb); };
};

export const onPlayersUpdatedScoped = (
  cb: (data: PlayersUpdatedPayload) => void
): (() => void) => {
  const socket = getSocket();
  socket.on("players_updated", cb);
  return () => { socket.off("players_updated", cb); };
};

export const onMatchStateRestoredScoped = (
  cb: (data: ChallengeAcceptedPayload) => void
): (() => void) => {
  const socket = getSocket();
  socket.on("match_state_restored", cb);
  return () => { socket.off("match_state_restored", cb); };
};

export interface LiveMatchResultPayload {
  matchId: string;
  matchType: "lobby" | "tournament";
  tournamentName: string | null;
  roundNumber: number | null;
  winnerId: number | null;
  players: Array<{ userId: number; nickname: string; avatarUrl: string | null; score: number }>;
  endedAt: number;
}

/** A match that just finished, with final scores — feeds the results ticker. */
export const onLiveMatchResultScoped = (
  cb: (data: LiveMatchResultPayload) => void
): (() => void) => {
  const socket = getSocket();
  socket.on("live_match_result", cb);
  return () => { socket.off("live_match_result", cb); };
};

