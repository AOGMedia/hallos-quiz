import { getToken } from "@/store/authStore";

/**
 * The signed-in user's numeric id, read from the JWT the parent platform
 * handed us. The backend signs `{ id, role }` (see authController), so `id` is
 * the claim to read. Returns null when there's no token or it isn't decodable.
 *
 * Extracted from the copies that had grown in TournamentWatcher and
 * TournamentGameplay — both need it to tell "this event is about me" from
 * "this event is about someone else in the tournament".
 */
export function getMyUserId(): number | null {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const id = Number(payload?.id);
    return Number.isFinite(id) ? id : null;
  } catch {
    return null;
  }
}
