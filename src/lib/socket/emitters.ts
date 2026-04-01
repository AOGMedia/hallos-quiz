import { getSocket, queueAnswer, drainAnswerQueue } from "./socket";
import apiClient from "@/lib/api/client";

export const joinMatch = (matchId: string): void => {
  getSocket().emit("join_match", { matchId });
};

export const getOnlinePlayers = (page: number, limit: number): void => {
  getSocket().emit("get_online_players", { page, limit });
};

/**
 * Submit answer with offline resilience:
 * 1. Try socket emit immediately
 * 2. If socket is down, queue the answer locally
 * 3. After 5 seconds offline, fall back to REST API
 */
export const submitAnswer = (payload: {
  matchId: string;
  questionId: string;
  answer: string;
  timeInSeconds: number;
}): void => {
  const socket = getSocket();

  if (socket.connected) {
    socket.emit("submit_answer", payload);
  } else {
    // Socket is down — queue the answer
    queueAnswer({ ...payload, queuedAt: Date.now() });

    // Start a 5-second REST fallback timer
    setTimeout(() => {
      const pending = drainAnswerQueue();
      if (pending.length === 0) return; // Already flushed via socket reconnect

      console.log(`[emitters] socket still down, sending ${pending.length} answers via REST`);
      for (const item of pending) {
        submitAnswerViaRest(item).catch((err) => {
          console.error("[emitters] REST fallback failed:", err);
          // Re-queue if REST also failed — socket reconnect will try again
          queueAnswer(item);
        });
      }
    }, 5000);
  }
};

/** REST API fallback for answer submission */
async function submitAnswerViaRest(payload: {
  matchId: string;
  questionId: string;
  answer: string;
  timeInSeconds: number;
}) {
  const res = await apiClient.post(`/api/quiz/lobby/match/${payload.matchId}/answer`, {
    questionId: payload.questionId,
    answerId: payload.answer,
    clientTimestamp: Math.floor(Date.now() - payload.timeInSeconds * 1000),
  });
  return res.data;
}

export const heartbeat = (): void => {
  getSocket().emit("heartbeat", { timestamp: Date.now() });
};
