import { getSocket, queueTournamentAnswer, drainTournamentAnswerQueue } from "./socket";
import apiClient from "@/lib/api/client";

export const joinTournament = (tournamentId: string): void => {
  getSocket().emit("join_tournament", { tournamentId });
};

/**
 * Leave a tournament room. Must be called whenever we stop caring about a
 * tournament (round finished, forfeited, eliminated, left the screen) —
 * without it the server keeps us subscribed, and a later `round_started` from
 * a tournament we're no longer in will pull us into gameplay via
 * TournamentWatcher.
 */
export const leaveTournament = (tournamentId: string): void => {
  getSocket().emit("leave_tournament", { tournamentId });
};

export interface TournamentAnswerPayload {
  tournamentId: string;
  roundNumber: number;
  questionId: string;
  answerId: string;
  clientTimestamp: number;
}

/** REST counterpart of `submit_tournament_answer` — same service call server-side */
async function submitTournamentAnswerViaRest(payload: TournamentAnswerPayload) {
  const res = await apiClient.post(
    `/api/quiz/tournament/${payload.tournamentId}/round/${payload.roundNumber}/answer`,
    {
      questionId: payload.questionId,
      answerId: payload.answerId,
      clientTimestamp: payload.clientTimestamp,
    }
  );
  return res.data;
}

/**
 * Submit an answer for a shared-question-set tournament round
 * (classic / speed_run / battle_royale). Knockout matches use the regular
 * `submitAnswer` match emitter instead — see @/lib/socket/emitters.
 *
 * Mirrors the 1v1 path's resilience: emit over the socket when it's up,
 * otherwise queue and fall back to REST after 5s, re-queuing if that fails
 * too. Without this an answer submitted during a network blip was simply
 * lost — socket.io's own buffering replays it late, past the server's
 * acceptance window, where it scores as a timeout.
 */
export const submitTournamentAnswer = (payload: TournamentAnswerPayload): void => {
  const socket = getSocket();

  if (socket.connected) {
    socket.emit("submit_tournament_answer", payload);
    return;
  }

  queueTournamentAnswer({ ...payload, queuedAt: Date.now() });

  setTimeout(() => {
    const pending = drainTournamentAnswerQueue();
    if (pending.length === 0) return; // already flushed via socket reconnect

    console.log(`[tournament] socket still down, sending ${pending.length} answers via REST`);
    for (const item of pending) {
      submitTournamentAnswerViaRest(item).catch((err) => {
        console.error("[tournament] REST fallback failed:", err);
        queueTournamentAnswer(item); // reconnect flush will retry
      });
    }
  }, 5000);
};
