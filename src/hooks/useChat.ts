import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  checkIsContact,
  getConversations,
  getOrCreateConversation,
  getMessages,
  sendMessageRest,
  markConversationRead,
  getUnreadCount,
  type GetConversationsParams,
  type GetMessagesParams,
} from "@/lib/api/chat";

export const CHAT_KEYS = {
  contactCheck: (userId: number)             => ["chat", "contacts", "check", userId] as const,
  conversations: (params: GetConversationsParams = {}) => ["chat", "conversations", params] as const,
  messages: (conversationId: string, params: GetMessagesParams = {}) =>
    ["chat", "messages", conversationId, params] as const,
  unreadCount: ()                             => ["chat", "unreadCount"] as const,
};

/** Gates the "Message" button — a player can only be messaged after a match or an invite link with them. */
export function useIsContact(userId: number | undefined) {
  return useQuery({
    queryKey: CHAT_KEYS.contactCheck(userId ?? -1),
    queryFn: () => checkIsContact(userId!),
    enabled: !!userId,
    staleTime: 60_000,
  });
}

export function useConversations(page = 1, limit = 20) {
  return useQuery({
    queryKey: CHAT_KEYS.conversations({ page, limit }),
    queryFn: () => getConversations({ page, limit }),
    staleTime: 10_000,
  });
}

/** Get-or-create a conversation with a contact. 403s (via the thrown axios error) if the target isn't a prior contact. */
export function useGetOrCreateConversation() {
  return useMutation({
    mutationFn: (userId: number) => getOrCreateConversation(userId),
  });
}

/** Full message history — always fetched fresh on mount; the socket push (see chatEvents.ts) is a live-tab optimization, never the source of truth. */
export function useChatMessages(conversationId: string | undefined, page = 1, limit = 30) {
  return useQuery({
    queryKey: CHAT_KEYS.messages(conversationId ?? "", { page, limit }),
    queryFn: () => getMessages(conversationId!, { page, limit }),
    enabled: !!conversationId,
    staleTime: 0,
  });
}

/** REST-fallback send, for when the socket is disconnected — mirrors the match-answer offline-queue fallback shape. Primary send path is the socket emitter in lib/socket/chatEvents.ts. */
export function useSendChatMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, body }: { conversationId: string; body: string }) =>
      sendMessageRest(conversationId, body),
    onSuccess: (_data, { conversationId }) => {
      qc.invalidateQueries({ queryKey: ["chat", "messages", conversationId] });
      qc.invalidateQueries({ queryKey: ["chat", "conversations"] });
    },
  });
}

export function useMarkConversationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) => markConversationRead(conversationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chat", "conversations"] });
      qc.invalidateQueries({ queryKey: CHAT_KEYS.unreadCount() });
    },
  });
}

/** Powers the sidebar badge. 30s poll (matching the app's existing heartbeat cadence) as a self-healing baseline; AppLayout also invalidates this on the chat_unread_update socket event for near-instant updates when the socket is healthy. */
export function useUnreadCount() {
  return useQuery({
    queryKey: CHAT_KEYS.unreadCount(),
    queryFn: () => getUnreadCount(),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}
