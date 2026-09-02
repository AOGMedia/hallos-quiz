import { io, Socket } from "socket.io-client";
import { getToken } from "@/store/authStore";

let socket: Socket | null = null;
let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
const HEARTBEAT_INTERVAL_MS = 30_000; // 30 seconds — well within the server's 120s timeout

/** Retries a connection that was rejected for auth, once a token appears. */
let authRetryTimer: ReturnType<typeof setInterval> | null = null;
const AUTH_RETRY_INTERVAL_MS = 1_000;

const clearAuthRetry = () => {
  if (authRetryTimer) {
    clearInterval(authRetryTimer);
    authRetryTimer = null;
  }
};

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
  // console.log("[socket] heartbeat started (every 30s)");
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
    socket = io(import.meta.env.VITE_API_URL ?? "https://prod-api.aahbibi.com", {
      // Read the token at every connection attempt, not once at creation.
      //
      // As a static value, the token was captured the first time getSocket()
      // ran. AppLayout calls getSocket() in a mount effect to register the user
      // as active, which can execute before the auth token is in sessionStorage
      // — so the socket connected with an empty token, the server's auth
      // middleware rejected it ("Authentication required"), and Socket.IO then
      // retried forever reusing that same empty token. The socket never
      // authenticated, so no server-pushed event (challenge_received above all)
      // could ever arrive. Only a page refresh fixed it, because by then the
      // token existed when the new socket was built. As a function, every
      // reconnect picks up the current token, so the retry that follows a
      // login actually succeeds.
      auth: (cb) => cb({ token: getToken() ?? "" }),
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,     // Never stop trying
      reconnectionDelay: 2000,            // Start at 2s
      reconnectionDelayMax: 10000,        // Max 10s between attempts
      randomizationFactor: 0.3,           // Jitter to prevent thundering herd
      timeout: 15000,                     // Allow 15s for initial connection
    });

    socket.on("connect", () => {
      // console.log("[socket] connected:", socket?.id);
      notifyConnectionChange(true);

      // Authenticated successfully — stop any auth-retry loop.
      clearAuthRetry();

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

      // Auto-rejoin the tournament room we were part of, same reasoning as
      // the match rejoin above — round_started/round_ended are room
      // broadcasts, so a missed reconnect means missing the next round.
      try {
        const tournamentId = sessionStorage.getItem("currentTournamentId");
        if (tournamentId) {
          console.log("[socket] auto-rejoining tournament:", tournamentId);
          socket?.emit("join_tournament", { tournamentId });
        }
      } catch (err) {
        console.error("[socket] tournament auto-rejoin error:", err);
      }

      // Flush any queued answers
      flushAnswerQueue();
      flushTournamentAnswerQueue();
    });

    socket.on("connect_error", (err) => {
      console.error("[socket] connect_error:", err.message);
      notifyConnectionChange(false);

      // An auth rejection is not a transport problem, so the built-in backoff
      // can't resolve it: it just replays the same handshake. The usual cause
      // is connecting a moment before the token lands in sessionStorage. Retry
      // explicitly once a token is actually available, so the connection
      // recovers on its own instead of requiring a page refresh.
      const isAuthFailure = /auth|token/i.test(err.message);
      if (isAuthFailure && !authRetryTimer) {
        authRetryTimer = setInterval(() => {
          if (!getToken()) return;      // still nothing to authenticate with
          if (socket?.connected) {      // recovered by other means
            clearAuthRetry();
            return;
          }
          console.log("[socket] token now present, retrying authentication");
          socket?.connect();
        }, AUTH_RETRY_INTERVAL_MS);
      }
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

// ── Offline Tournament Answer Queue ──────────────────────────────────────────
// Same contract as the match queue above, for shared-question tournament
// rounds. Kept here rather than in tournamentEmitters so the reconnect handler
// can flush it without importing back into that module.

interface QueuedTournamentAnswer {
  tournamentId: string;
  roundNumber: number;
  questionId: string;
  answerId: string;
  clientTimestamp: number;
  queuedAt: number;
}

const tournamentAnswerQueue: QueuedTournamentAnswer[] = [];

export const queueTournamentAnswer = (payload: QueuedTournamentAnswer) => {
  tournamentAnswerQueue.push(payload);
  console.log(`[socket] tournament answer queued (${tournamentAnswerQueue.length} pending)`);
};

export const drainTournamentAnswerQueue = (): QueuedTournamentAnswer[] => {
  return tournamentAnswerQueue.splice(0, tournamentAnswerQueue.length);
};

export const flushTournamentAnswerQueue = () => {
  if (tournamentAnswerQueue.length === 0) return;
  const s = socket;
  if (!s?.connected) return;

  console.log(`[socket] flushing ${tournamentAnswerQueue.length} queued tournament answers`);
  while (tournamentAnswerQueue.length > 0) {
    const item = tournamentAnswerQueue.shift()!;
    s.emit("submit_tournament_answer", item);
  }
};

/** Call on logout / session end */
export const disconnectSocket = (): void => {
  stopHeartbeat();
  clearAuthRetry(); // never leave the retry loop running past an intentional disconnect
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
