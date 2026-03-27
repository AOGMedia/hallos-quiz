import { io, Socket } from "socket.io-client";
import { getToken } from "@/store/authStore";

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const token = getToken();
    // console.log("[socket] creating socket. token present:", !!token, "preview:", token ? `${token.substring(0, 30)}...` : "NULL");
    // console.log("[socket] sessionStorage auth_token:", sessionStorage.getItem("auth_token"));

    socket = io(import.meta.env.VITE_API_URL ?? "https://prod-api.aahbibi.com", {
      auth: { token: token ?? "" },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      console.log("[socket] connected:", socket?.id);
    });
    socket.on("connect_error", (err) => {
      console.error("[socket] connect_error:", err.message);
    });
    socket.on("disconnect", (reason) => {
      console.warn("[socket] disconnected:", reason);
    });
  }

  // If socket exists but was disconnected, reconnect it
  if (!socket.connected) {
    socket.connect();
  }

  return socket;
};

/** Call on logout / session end */
export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
