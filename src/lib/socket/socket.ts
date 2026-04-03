import { io, Socket } from "socket.io-client";
import { getToken } from "@/store/authStore";

let socket: Socket | null = null;
let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
const HEARTBEAT_INTERVAL_MS = 30_000; // 30 seconds — well within the server's 120s timeout

/** Listeners that want to know about connection state changes */
type ConnectionListener = (connected: boolean) => void;
const connectionListeners = new Set<ConnectionListener>();

export const onConnectionChange = (fn: ConnectionListener) => {
  connectionListeners.add(fn);
  return () => { connectionListeners.delete(fn); };
};

const notifyConnectionChange = (connected: boolean) => {
  connectionListeners.forEach((fn) => fn(connected));
};

/** Start sending heartbeat events to keep the server's custom lastHeartbeat fresh */
const startHeartbeat = () => {
  stopHeartbeat(); // clear any previous interval first
  heartbeatInterval = setInterval(() => {
    if (socket?.connected) {
      socket.emit("heartbeat", { timestamp: Date.now() });
    }
  }, HEARTBEAT_INTERVAL_MS);
  console.log("[socket] heartbeat started (every 30s)");
};

/** Stop the heartbeat interval */
const stopHeartbeat = () => {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
};

export const getSocket = (): Socket => {
  if (!socket) {
    const token = getToken();

    socket = io(import.meta.env.VITE_API_URL ?? "https://prod-api.aahbibi.com", {
      auth: { token: token ?? "" },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,     // Never stop trying
      reconnectionDelay: 2000,            // Start at 2s
      reconnectionDelayMax: 10000,        // Max 10s between attempts
      randomizationFactor: 0.3,           // Jitter to prevent thundering herd
      timeout: 15000,                     // Allow 15s for initial connection
    });

    socket.on("connect", () => {
      console.log("[socket] connected:", socket?.id);
      notifyConnectionChange(true);

      // Start the application-level heartbeat to keep the server connection alive
      startHeartbeat();

      // Auto-rejoin match room on reconnection to survive network blips
      try {
        const matchData = sessionStorage.getItem("currentMatch");
        if (matchData) {
          const { matchId } = JSON.parse(matchData);
          if (matchId) {
            console.log("[socket] auto-rejoining match:", matchId);
            socket?.emit("join_match", { matchId });
          }
        }
      } catch (err) {
        console.error("[socket] auto-rejoin error:", err);
      }

      // Flush any queued answers
      flushAnswerQueue();
    });

    socket.on("connect_error", (err) => {
      console.error("[socket] connect_error:", err.message);
      notifyConnectionChange(false);
    });

    socket.on("disconnect", (reason) => {
      console.warn("[socket] disconnected:", reason);
      stopHeartbeat();
      notifyConnectionChange(false);

      // If server deliberately disconnected us, don't auto-reconnect
      if (reason === "io server disconnect") {
        socket?.connect();
      }
    });
  }

  // If socket exists but was disconnected, reconnect it
  if (!socket.connected) {
    socket.connect();
  }

  return socket;
};

// ── Offline Answer Queue ─────────────────────────────────────────────────────

interface QueuedAnswer {
  matchId: string;
  questionId: string;
  answer: string;
  timeInSeconds: number;
  queuedAt: number;
}

const answerQueue: QueuedAnswer[] = [];

/** Queue an answer for later delivery */
export const queueAnswer = (payload: QueuedAnswer) => {
  answerQueue.push(payload);
  console.log(`[socket] answer queued (${answerQueue.length} pending)`);
};

/** Flush all queued answers through the socket */
export const flushAnswerQueue = () => {
  if (answerQueue.length === 0) return;
  const s = socket;
  if (!s?.connected) return;

  console.log(`[socket] flushing ${answerQueue.length} queued answers`);
  while (answerQueue.length > 0) {
    const item = answerQueue.shift()!;
    s.emit("submit_answer", item);
  }
};

/** Get current queue length (for REST fallback decisions) */
export const getAnswerQueueLength = () => answerQueue.length;

/** Get and drain the queue (for REST fallback) */
export const drainAnswerQueue = (): QueuedAnswer[] => {
  return answerQueue.splice(0, answerQueue.length);
};

/** Call on logout / session end */
export const disconnectSocket = (): void => {
  stopHeartbeat();
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
