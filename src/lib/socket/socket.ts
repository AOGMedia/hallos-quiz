import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = (token: string): Socket => {
  if (!socket) {
    socket = io(import.meta.env.VITE_API_URL ?? "https://prod-api.aahbibi.com", {
      auth: { token },
      transports: ["websocket"],
    });
  }
  return socket;
};

/** Call this on logout / session end to fully disconnect and reset */
export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
