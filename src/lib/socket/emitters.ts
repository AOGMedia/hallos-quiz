import { getSocket } from "./socket";

export const joinMatch = (matchId: string): void => {
  getSocket().emit("join_match", { matchId });
};

export const getOnlinePlayers = (page: number, limit: number): void => {
  getSocket().emit("get_online_players", { page, limit });
};

export const submitAnswer = (payload: {
  matchId: string;
  questionId: string;
  answer: string;
  timeInSeconds: number;
}): void => {
  getSocket().emit("submit_answer", payload);
};

export const heartbeat = (): void => {
  getSocket().emit("heartbeat", { timestamp: Date.now() });
};
