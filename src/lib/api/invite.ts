import axios from "axios";
import { getToken } from "@/store/authStore";

// ── Clients ───────────────────────────────────────────────────────────────────
//
// Two clients on purpose:
//
// `inviteClient` behaves like the shared apiClient but sends the user back to the
// invite they came from after re-auth, instead of the generic dashboard.
//
// `publicClient` has NO auth header and NO 401 interceptor. /invite/resolve/:token
// is public, and routing it through the shared apiClient would let a stale token
// trigger the global window.location redirect and destroy the landing page before
// it ever renders.

const PARENT_APP_URL = import.meta.env.VITE_PARENT_APP_URL ?? "https://www.hallos.net";

/** Absolute URL of an invite on this app — used as the post-signin return target. */
export const buildInviteUrl = (token: string): string =>
  `${window.location.origin}/invite/${token}`;

/** Send the user to the parent app's signin, returning them to this invite afterwards. */
export const redirectToSignin = (token: string): void => {
  const redirect = encodeURIComponent(buildInviteUrl(token));
  window.location.href = `${PARENT_APP_URL}/signin?redirect=${redirect}`;
};

const inviteClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

inviteClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

inviteClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message =
      error.response?.data?.message ?? error.message ?? "Request failed";

    if (status === 401) {
      sessionStorage.removeItem("auth_token");
      const pending = sessionStorage.getItem("pending_invite_token");
      if (pending) {
        redirectToSignin(pending);
      } else {
        window.location.href = `${PARENT_APP_URL}/dashboard/games`;
      }
      return new Promise(() => {}); // stop error propagation
    }

    return Promise.reject(new Error(message));
  }
);

/** Bare client — no auth, no redirect-on-401. Only for the public resolve endpoint. */
const publicClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});

// ── Types ─────────────────────────────────────────────────────────────────────

export type InviteChannel = "email" | "sms" | "whatsapp" | "link";

export type InviteOutcomeType =
  | "matched"
  | "pending_notify"
  | "self_blocked"
  | "expired"
  | "revoked";

export type InviteStatus = "active" | "claimed" | "expired" | "revoked";

export interface CreateInvitePayload {
  channel?: InviteChannel;
  toEmail?: string | null;
  toPhone?: string | null;
  wagerAmount?: number;
  categoryId?: string;
  expiresInDays?: number;
}

export interface CreateInviteResponse {
  success: boolean;
  invite: {
    id: string;
    channel: InviteChannel;
    wagerAmount: number;
    categoryId: string | null;
    expiresAt: string;
  };
  inviteUrl: string;
  whatsappUrl: string;
  smsUri: string;
}

export interface ResolveInviteResponse {
  success: boolean;
  found: boolean;
  valid: boolean;
  expired: boolean;
  revoked: boolean;
  channel: InviteChannel;
  wagerAmount: number;
  categoryId: string | null;
  categoryName: string | null;
  /** Only known when the invite targeted a specific email — otherwise null. */
  recipientHasAccount: boolean | null;
  inviter: {
    userId: number;
    nickname: string;
    avatarUrl: string;
    online: boolean;
  };
  message?: string;
}

/** Same shape the game screen already consumes from acceptChallenge. */
export interface InviteMatchPayload {
  success: boolean;
  matchId: string;
  challengeId: string;
  startTime: string;
  questions: Array<{
    id: string;
    questionText: string;
    options: Record<string, string>;
    difficulty?: string;
  }>;
  challenger: {
    userId: number;
    nickname: string;
    avatarUrl: string;
  };
}

export interface ClaimInviteResponse {
  success: boolean;
  outcome: InviteOutcomeType;
  matched: boolean;
  matchId: string | null;
  inviterUserId: number;
  /** Present only on the FIRST successful claim — refetch the match on a replay. */
  matchPayload?: InviteMatchPayload;
  alreadyClaimed?: boolean;
  message?: string;
}

export interface SentInvite {
  id: string;
  inviteUrl: string;
  channel: InviteChannel;
  toEmail: string | null;
  toPhone: string | null;
  wagerAmount: number;
  categoryId: string | null;
  status: InviteStatus;
  clicksCount: number;
  claimsCount: number;
  expiresAt: string;
  createdAt: string;
}

export interface MyInvitesResponse {
  success: boolean;
  invites: SentInvite[];
  totalCount: number;
  page: number;
  totalPages: number;
}

// ── Endpoints ─────────────────────────────────────────────────────────────────

export const createInvite = async (
  payload: CreateInvitePayload = {}
): Promise<CreateInviteResponse> => {
  const res = await inviteClient.post<CreateInviteResponse>(
    "/api/quiz/invite/create",
    { channel: "link", ...payload }
  );
  return res.data;
};

/** Carries the HTTP status so the landing page can tell "dead link" from "needs auth". */
export class ResolveInviteError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "ResolveInviteError";
    this.status = status;
  }
}

/**
 * Public — deliberately unauthenticated so a stale token can't bounce the
 * recipient off the landing page. A 404 means a dead link, not an error.
 *
 * If the endpoint turns out to require auth after all, it surfaces as 401/403
 * and the landing page falls back to the sign-in CTA rather than wrongly
 * telling the user their link is broken.
 */
export const resolveInvite = async (
  token: string
): Promise<ResolveInviteResponse> => {
  try {
    const res = await publicClient.get<ResolveInviteResponse>(
      `/api/quiz/invite/resolve/${token}`
    );
    return res.data;
  } catch (err) {
    const status = axios.isAxiosError(err) ? err.response?.status : undefined;
    const message = axios.isAxiosError(err)
      ? err.response?.data?.message ?? err.message
      : (err as Error).message;
    throw new ResolveInviteError(message ?? "Could not open this invite", status);
  }
};

export const claimInvite = async (
  token: string
): Promise<ClaimInviteResponse> => {
  const res = await inviteClient.post<ClaimInviteResponse>(
    "/api/quiz/invite/claim",
    { token }
  );
  return res.data;
};

export const getMyInvites = async (
  params: { page?: number; limit?: number } = {}
): Promise<MyInvitesResponse> => {
  const res = await inviteClient.get<MyInvitesResponse>("/api/quiz/invite/mine", {
    params: { page: 1, limit: 20, ...params },
  });
  return res.data;
};

export const revokeInvite = async (
  id: string
): Promise<{ success: boolean }> => {
  const res = await inviteClient.post<{ success: boolean }>(
    `/api/quiz/invite/${id}/revoke`
  );
  return res.data;
};
