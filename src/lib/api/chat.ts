import apiClient from "./client";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ChatUser {
  userId: number;
  nickname: string;
  avatarUrl: string | null;
}

export interface Conversation {
  id: string;
  otherUser: ChatUser;
  lastMessagePreview: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
}

export interface ChatMessage {
  id: string;
  senderId: number;
  body: string;
  createdAt: string;
  readAt: string | null;
}

export interface CheckContactResponse {
  success: boolean;
  isContact: boolean;
}

export interface GetConversationsParams {
  page?: number;
  limit?: number;
}

export interface GetConversationsResponse {
  success: boolean;
  conversations: Conversation[];
  total: number;
  page: number;
  totalPages: number;
}

export interface GetOrCreateConversationResponse {
  success: boolean;
  conversationId: string;
  isNew: boolean;
}

export interface GetMessagesParams {
  page?: number;
  limit?: number;
}

export interface GetMessagesResponse {
  success: boolean;
  messages: ChatMessage[];
  total: number;
  page: number;
  totalPages: number;
}

export interface SendMessageResponse {
  success: boolean;
  message: ChatMessage;
}

export interface MarkReadResponse {
  success: boolean;
  markedCount: number;
}

export interface UnreadCountResponse {
  success: boolean;
  unreadCount: number;
}

// ── API functions ─────────────────────────────────────────────────────────────

export const checkIsContact = async (userId: number): Promise<CheckContactResponse> => {
  const res = await apiClient.get<CheckContactResponse>(`/api/quiz/chat/contacts/${userId}/check`);
  return res.data;
};

export const getConversations = async (
  params: GetConversationsParams = {}
): Promise<GetConversationsResponse> => {
  const res = await apiClient.get<GetConversationsResponse>("/api/quiz/chat/conversations", {
    params: { page: 1, limit: 20, ...params },
  });
  return res.data;
};

export const getOrCreateConversation = async (
  userId: number
): Promise<GetOrCreateConversationResponse> => {
  const res = await apiClient.get<GetOrCreateConversationResponse>(
    `/api/quiz/chat/conversations/with/${userId}`
  );
  return res.data;
};

export const getMessages = async (
  conversationId: string,
  params: GetMessagesParams = {}
): Promise<GetMessagesResponse> => {
  const res = await apiClient.get<GetMessagesResponse>(
    `/api/quiz/chat/conversations/${conversationId}/messages`,
    { params: { page: 1, limit: 30, ...params } }
  );
  return res.data;
};

/** REST fallback send — used when the socket is disconnected. Primary send path is the socket emitter in lib/socket/chatEvents.ts. */
export const sendMessageRest = async (
  conversationId: string,
  body: string
): Promise<SendMessageResponse> => {
  const res = await apiClient.post<SendMessageResponse>(
    `/api/quiz/chat/conversations/${conversationId}/messages`,
    { body }
  );
  return res.data;
};

export const markConversationRead = async (conversationId: string): Promise<MarkReadResponse> => {
  const res = await apiClient.post<MarkReadResponse>(
    `/api/quiz/chat/conversations/${conversationId}/read`
  );
  return res.data;
};

export const getUnreadCount = async (): Promise<UnreadCountResponse> => {
  const res = await apiClient.get<UnreadCountResponse>("/api/quiz/chat/unread-count");
  return res.data;
};
