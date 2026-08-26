import { useState, useEffect, useRef, useMemo } from "react";
import { useLocation } from "react-router-dom";
import {
  Loader2, MessageCircle, ChevronLeft, ChevronRight, ArrowLeft, Send,
} from "lucide-react";
import {
  useConversations,
  useChatMessages,
  useSendChatMessage,
  useMarkConversationRead,
} from "@/hooks/useChat";
import { sendChatMessage, onChatMessageScoped } from "@/lib/socket/chatEvents";
import { onConnectionChange } from "@/lib/socket/socket";
import { useQueryClient } from "@tanstack/react-query";
import { getMyUserId } from "@/lib/auth/currentUser";
import type { ChatMessage } from "@/lib/api/chat";

const PAGE_LIMIT = 20;

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function fmtListDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay ? fmtTime(iso) : d.toLocaleDateString([], { month: "short", day: "numeric" });
}

// ── Conversation list ───────────────────────────────────────────────────────

interface ConversationListProps {
  onOpen: (conversationId: string) => void;
}

const ConversationList = ({ onOpen }: ConversationListProps) => {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useConversations(page, PAGE_LIMIT);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading your conversations…
      </div>
    );
  }

  const conversations = data?.conversations ?? [];
  const totalPages = data?.totalPages ?? 1;

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-3">
          <MessageCircle className="w-6 h-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-semibold text-foreground">No conversations yet</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs">
          Message an opponent after a match, or from the Lobby — chat unlocks once you've
          played or invited each other.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-3 sm:p-4">
      {conversations.map((c) => (
        <button
          key={c.id}
          onClick={() => onOpen(c.id)}
          className="w-full flex items-center gap-3 bg-background border border-border rounded-xl p-3 text-left hover:bg-muted/50 transition-colors"
        >
          <div className="w-11 h-11 rounded-full border-2 border-border bg-secondary flex-shrink-0 overflow-hidden flex items-center justify-center">
            {c.otherUser.avatarUrl ? (
              <img src={c.otherUser.avatarUrl} alt={c.otherUser.nickname} className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-muted-foreground">
                {c.otherUser.nickname.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-foreground truncate">{c.otherUser.nickname}</span>
              <span className="text-[11px] text-muted-foreground flex-shrink-0">
                {fmtListDate(c.lastMessageAt)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {c.lastMessagePreview ?? "Say hello 👋"}
            </p>
          </div>

          {c.unreadCount > 0 && (
            <span className="flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-accent text-accent-foreground text-[11px] font-semibold flex-shrink-0">
              {c.unreadCount > 99 ? "99+" : c.unreadCount}
            </span>
          )}
        </button>
      ))}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="p-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-muted-foreground">
            Page <span className="font-semibold text-foreground">{page}</span> of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="p-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

// ── Thread ───────────────────────────────────────────────────────────────────

interface ChatThreadProps {
  conversationId: string;
  onBack: () => void;
}

const ChatThread = ({ conversationId, onBack }: ChatThreadProps) => {
  const myUserId = useMemo(getMyUserId, []);
  const queryClient = useQueryClient();
  const { data, isLoading } = useChatMessages(conversationId, 1, PAGE_LIMIT);
  const { mutate: sendViaRest, isPending: sendingViaRest } = useSendChatMessage();
  const { mutate: markRead } = useMarkConversationRead();

  const [draft, setDraft] = useState("");
  const [socketConnected, setSocketConnected] = useState(true);
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  // History comes newest-first from the server; render oldest-first.
  const serverMessages = useMemo(
    () => [...(data?.messages ?? [])].reverse(),
    [data?.messages]
  );

  // Merge server history with anything appended live since mount (either
  // pushed by the socket or optimistically added on send), de-duplicated by id.
  const allMessages = useMemo(() => {
    const byId = new Map<string, ChatMessage>();
    for (const m of serverMessages) byId.set(m.id, m);
    for (const m of localMessages) byId.set(m.id, m);
    return [...byId.values()].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [serverMessages, localMessages]);

  useEffect(() => {
    setLocalMessages([]);
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [allMessages.length]);

  useEffect(() => {
    markRead(conversationId);
  }, [conversationId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => onConnectionChange(setSocketConnected), []);

  // Live push while this thread is open — patch local state directly
  // rather than refetching; the server payload is already sanitized.
  useEffect(() => {
    return onChatMessageScoped((data) => {
      if (data.conversationId !== conversationId) return;
      setLocalMessages((prev) => [...prev, {
        id: data.message.id,
        senderId: data.message.senderId,
        body: data.message.body,
        createdAt: data.message.createdAt,
        readAt: null,
      }]);
      if (data.message.senderId !== myUserId) {
        markRead(conversationId);
      } else {
        queryClient.invalidateQueries({ queryKey: ["chat", "conversations"] });
      }
    });
  }, [conversationId, myUserId, markRead, queryClient]);

  const handleSend = () => {
    const body = draft.trim();
    if (!body) return;
    setDraft("");

    if (socketConnected) {
      // Optimistic local append — the server ack (chat_message_sent) is
      // fire-and-forget here since the message is already visible.
      setLocalMessages((prev) => [...prev, {
        id: `local-${Date.now()}`,
        senderId: myUserId ?? -1,
        body,
        createdAt: new Date().toISOString(),
        readAt: null,
      }]);
      sendChatMessage(conversationId, body);
    } else {
      sendViaRest({ conversationId, body });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 p-3 sm:p-4 border-b border-border flex-shrink-0">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <span className="text-sm font-semibold text-foreground">Conversation</span>
      </div>

      {!socketConnected && (
        <div className="px-3 sm:px-4 py-1.5 bg-warning/10 text-warning text-[11px] text-center flex-shrink-0">
          Reconnecting… messages will send once you're back online
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading messages…
          </div>
        ) : allMessages.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-10">
            No messages yet — say hello 👋
          </p>
        ) : (
          allMessages.map((m) => {
            const isMine = m.senderId === myUserId;
            return (
              <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                    isMine
                      ? "bg-accent text-accent-foreground rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <p className={`text-[10px] mt-1 ${isMine ? "text-accent-foreground/70" : "text-muted-foreground"}`}>
                    {fmtTime(m.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-center gap-2 p-3 sm:p-4 border-t border-border flex-shrink-0">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="Type a message…"
          maxLength={2000}
          className="flex-1 bg-background border border-border rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-accent transition-colors"
        />
        <button
          onClick={handleSend}
          disabled={!draft.trim() || sendingViaRest}
          className="flex items-center justify-center w-10 h-10 flex-shrink-0 rounded-xl bg-accent text-accent-foreground disabled:opacity-40 hover:bg-accent/90 transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// ── Page ─────────────────────────────────────────────────────────────────────

/**
 * Single-pane with back-navigation, not split-pane — no page in this app
 * uses a master-detail layout, so this follows the established single-column
 * convention instead of introducing a new shape.
 */
const Chat = () => {
  const location = useLocation() as { state?: { openConversationId?: string } };
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    location.state?.openConversationId ?? null
  );

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      {selectedConversationId ? (
        <ChatThread
          conversationId={selectedConversationId}
          onBack={() => setSelectedConversationId(null)}
        />
      ) : (
        <div className="flex-1 overflow-y-auto">
          <ConversationList onOpen={setSelectedConversationId} />
        </div>
      )}
    </div>
  );
};

export default Chat;
