/**
 * Holds the invite token across the auth round trip to hallos.net.
 *
 * sessionStorage is scoped to (origin, tab) and survives navigating away to the
 * parent app and back, which is exactly how `campaign_token` already works in
 * main.tsx. localStorage would outlive the tab and resurrect stale invites.
 *
 * NOTE: the invite token is only ever read from the URL *path* (/invite/:token).
 * It must never travel as `?token=`, because main.tsx treats that query param as
 * the auth JWT and would overwrite the user's session with it.
 */

const KEY = "pending_invite_token";

export const setPendingInvite = (token: string): void => {
  try {
    sessionStorage.setItem(KEY, token);
  } catch {
    // Private-mode storage failure — the in-page flow still works without it.
  }
};

export const getPendingInvite = (): string | null => {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
};

export const clearPendingInvite = (): void => {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // ignore
  }
};

// ── Claim de-duplication ──────────────────────────────────────────────────────
// Module-level so React 18 StrictMode's double-invoke can't fire two claims for
// the same token. The server is idempotent too, but a second call would come
// back as `alreadyClaimed` with no matchPayload, which needlessly costs a refetch.

const claimed = new Set<string>();

/** Returns true the first time it's called for a token, false afterwards. */
export const markClaimStarted = (token: string): boolean => {
  if (claimed.has(token)) return false;
  claimed.add(token);
  return true;
};

/**
 * Let a token be claimed again. Only ever called from an explicit user-driven
 * retry — never automatically on error, or the landing page would re-fire the
 * claim on every render and hammer the rate-limited endpoint.
 */
export const releaseClaim = (token: string): void => {
  claimed.delete(token);
};

// ── Result cache ──────────────────────────────────────────────────────────────
// Survives a StrictMode unmount/remount, which would otherwise drop the claim
// response on the floor — and the replayed claim that follows omits
// `matchPayload`, forcing an avoidable match refetch.

const results = new Map<string, unknown>();

export const cacheClaimResult = <T>(token: string, result: T): void => {
  results.set(token, result);
};

export const getCachedClaimResult = <T>(token: string): T | null =>
  (results.get(token) as T | undefined) ?? null;
