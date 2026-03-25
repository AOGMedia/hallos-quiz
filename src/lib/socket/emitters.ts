import { getSocket } from "./socket";

export const joinMatch = (token: string, matchId: string): void => {
  const socket = getSocket(token);
  socket.emit("join_match", { matchId });
};

export const submitAnswer = (
  token: string,
  payload: { matchId: string; questionId: string; answer: string; timeInSeconds: number }
): void => {
  const socket = getSocket(token);
  socket.emit("submit_answer", payload);
};

export const heartbeat = (token: string): void => {
  const socket = getSocket(token);
  socket.emit("heartbeat", { timestamp: Date.now() });
};
