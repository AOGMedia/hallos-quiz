import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { UserPlus, X } from "lucide-react";
import { getPendingInvite } from "@/lib/invite/pendingInvite";
import { getToken } from "@/store/authStore";
import { useQuizProfileStore } from "@/store/quizProfileStore";

/** Routes that own the full viewport — a floating banner would be intrusive. */
const SUPPRESSED = ["/game", "/campaign/quiz", "/invite", "/", "/profile"];

function hasQuizProfile(): boolean {
  if (useQuizProfileStore.getState().isRegistered) return true;
  try {
    const stored = sessionStorage.getItem("userProfile");
    if (stored && JSON.parse(stored)?.nickname) return true;
    const persisted = localStorage.getItem("quiz-profile");
    if (!persisted) return false;
    const { state } = JSON.parse(persisted);
    return !!state?.isRegistered;
  } catch {
    return false;
  }
}

/**
 * Passive resume prompt for an invite that was opened before the user finished
 * signing up. Renders a dismissible banner and NEVER navigates on its own — the
 * user decides whether to open it.
 *
 * This is what lets a brand-new invitee reach their claim without any change to
 * the existing ProfileSetup → /lobby path: they land in the lobby as usual and
 * the banner is waiting.
 */
const PendingInviteWatcher = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [dismissed, setDismissed] = useState(false);

  // Re-evaluated on every navigation, which is exactly when it can become true.
  const token = getPendingInvite();
  const isRegistered = useQuizProfileStore((s) => s.isRegistered);

  if (dismissed || !token || !getToken()) return null;
  if (!isRegistered && !hasQuizProfile()) return null;
  if (location.pathname.startsWith("/invite/")) return null;
  if (SUPPRESSED.includes(location.pathname)) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-md animate-fade-in">
      <div className="flex items-center gap-3 bg-card border border-primary/40 rounded-xl px-4 py-3 shadow-lg">
        <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
          <UserPlus className="w-4 h-4 text-primary" />
        </div>
        <p className="text-xs sm:text-sm text-foreground flex-1 min-w-0">
          You have a pending invite waiting.
        </p>
        <button
          onClick={() => navigate(`/invite/${token}`)}
          className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity flex-shrink-0"
        >
          Open
        </button>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="w-7 h-7 rounded-full hover:bg-muted flex items-center justify-center flex-shrink-0"
        >
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
};

export default PendingInviteWatcher;
