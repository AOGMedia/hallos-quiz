import { getSocket } from "./socket";

/**
 * Chat socket events — kept in their own file rather than added to the
 * already-large events.ts. Every subscription here uses the Scoped pattern
 * (returns an unsubscribe closure that removes only its own handler) — that
 * file documents this as its preferred pattern for new code, and chat is
 * exactly the case where a naive `socket.off(event)` would be dangerous:
 * a message can arrive while both the sidebar badge listener and an open
 * conversation thread are subscribed to the same event at once.
 */

// ── Emit ──────────────────────────────────────────────────────────────────────

/** Primary send path — instant delivery when the socket is connected. Falls back to the REST mutation (see hooks/useChat.ts) when it isn't. */
export const sendChatMessage = (conversationId: string, body: string): void => {
  getSocket().emit("send_chat_message", { conversationId, body });
};

// ── Listen ────────────────────────────────────────────────────────────────────

export interface ChatMessagePushPayload {
  conversationId: string;
  message: { id: string; senderId: number; body: string; createdAt: string };
}

/** A new message arrived — the body is already server-sanitized, safe to render as-is. */
export const onChatMessageScoped = (
  cb: (data: ChatMessagePushPayload) => void
): (() => void) => {
  const socket = getSocket();
  socket.on("chat_message", cb);
  return () => { socket.off("chat_message", cb); };
};

export interface ChatUnreadUpdatePayload {
  conversationId: string;
  delta: number;
}

/** Lightweight badge nudge, separate from the full message payload so the always-mounted sidebar listener never has to touch message bodies. */
export const onChatUnreadUpdateScoped = (
  cb: (data: ChatUnreadUpdatePayload) => void
): (() => void) => {
  const socket = getSocket();
  socket.on("chat_unread_update", cb);
  return () => { socket.off("chat_unread_update", cb); };
};

export interface ChatMessageSentAckPayload {
  conversationId: string;
  messageId: string;
  createdAt: string;
}

/** Server ack for a message this client just sent over the socket. */
export const onChatMessageSentScoped = (
  cb: (data: ChatMessageSentAckPayload) => void
): (() => void) => {
  const socket = getSocket();
  socket.on("chat_message_sent", cb);
  return () => { socket.off("chat_message_sent", cb); };
};
