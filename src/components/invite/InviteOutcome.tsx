import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Swords, Compass, AlertTriangle, Loader2 } from "lucide-react";
import { getMatch } from "@/lib/api/lobby";
import { joinMatch } from "@/lib/socket/emitters";
import { soundEngine } from "@/lib/soundEngine";
import type { ClaimInviteResponse, ResolveInviteResponse } from "@/lib/api/invite";

interface InviteOutcomeProps {
  claim: ClaimInviteResponse;
  inviter: ResolveInviteResponse["inviter"];
  wagerAmount: number;
  categoryName: string | null;
}

/** Copy for every non-matched outcome. All are success cases, never errors. */
const NOT_MATCHED_COPY: Record<string, (n: string) => string> = {
  pending_notify: (n) =>
    `You're in! ${n} has been notified and will challenge you once you're both online.`,
  self_blocked: () => "This is your own invite link — share it with a friend instead.",
  expired: (n) =>
    `This invite link has expired, but you're all set up. Ask ${n} for a fresh one.`,
  revoked: (n) => `${n} cancelled this invite, but you're all set up to play.`,
};

const InviteOutcome = ({
  claim,
  inviter,
  wagerAmount,
  categoryName,
}: InviteOutcomeProps) => {
  const navigate = useNavigate();
  const [entering, setEntering] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMatched = claim.matched && !!claim.matchId;

  // ── Play now — the ONLY path that writes match state ──────────────────────
  // Deliberately not done at claim time: the app shell clears `currentMatch` on
  // every navigation, and the user is free to go elsewhere from this screen.
  const handlePlayNow = async () => {
    if (!claim.matchId || entering) return;
    setEntering(true);
    setError(null);

    try {
      // matchPayload is only sent on the FIRST claim — refetch on a replay.
      let questions = claim.matchPayload?.questions;
      let challengerId: number | undefined = claim.matchPayload?.challenger?.userId;

      if (!questions?.length) {
        const res = await getMatch(claim.matchId);
        questions = res.match?.questions;
        challengerId = res.match?.challengerId ?? inviter.userId;
      }

      if (!questions?.length) {
        setError("This match is no longer available. Head to the lobby to find a game.");
        setEntering(false);
        return;
      }

      const stored = sessionStorage.getItem("userProfile");
      const me = stored ? JSON.parse(stored) : { nickname: "You", avatar: "" };

      sessionStorage.removeItem("matchEnded");
      sessionStorage.setItem(
        "currentMatch",
        JSON.stringify({
          matchId: claim.matchId,
          player1: { name: me.nickname, avatar: me.avatar },
          player2: { name: inviter.nickname, avatar: inviter.avatarUrl },
          questions,
          // The inviter created the challenge, so they are the challenger.
          challengerId: challengerId ?? inviter.userId,
        })
      );

      soundEngine.play("start_challenge");
      joinMatch(claim.matchId);
      navigate("/game", { replace: true });
    } catch (err) {
      setError((err as Error).message ?? "Could not open the match — please try again.");
      setEntering(false);
    }
  };

  const handleNotYet = () => {
    // Only warn when there is real money already escrowed.
    if (isMatched && wagerAmount > 0) {
      setConfirmLeave(true);
      return;
    }
    navigate("/lobby", { replace: true });
  };

  // ── Not matched ───────────────────────────────────────────────────────────
  if (!isMatched) {
    const copy =
      NOT_MATCHED_COPY[claim.outcome]?.(inviter.nickname) ??
      NOT_MATCHED_COPY.pending_notify(inviter.nickname);

    return (
      <div className="space-y-4 animate-fade-in">
        <p className="text-sm text-muted-foreground text-center">{copy}</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={() => navigate("/lobby")} className="btn-primary flex-1">
            Go to lobby
          </button>
          <button
            onClick={() => navigate("/guide")}
            className="btn-ghost flex-1 flex items-center justify-center gap-2"
          >
            <Compass className="w-4 h-4" />
            Explore the app
          </button>
        </div>
      </div>
    );
  }

  // ── Matched — confirm before abandoning a staked, live match ──────────────
  if (confirmLeave) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-start gap-3 p-4 bg-warning/10 border border-warning/30 rounded-xl text-left">
          <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
          <p className="text-sm text-foreground">
            Your <span className="font-semibold">{wagerAmount.toLocaleString()} MP</span> is
            already staked and this match is live.{" "}
            {inviter.nickname} may already be waiting. Leave anyway?
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={handlePlayNow} disabled={entering} className="btn-primary flex-1">
            Play now
          </button>
          <button
            onClick={() => navigate("/lobby", { replace: true })}
            className="btn-ghost flex-1"
          >
            Leave
          </button>
        </div>
      </div>
    );
  }

  // ── Matched ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-center gap-2 text-success text-sm font-semibold">
        <Swords className="w-4 h-4" />
        Match ready
      </div>

      <p className="text-sm text-muted-foreground text-center">
        You're matched against {inviter.nickname}
        {categoryName ? ` in ${categoryName}` : ""}
        {wagerAmount > 0 ? ` for ${wagerAmount.toLocaleString()} MP` : ""}.
      </p>

      {error && (
        <p className="text-xs text-destructive text-center px-2">{error}</p>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handlePlayNow}
          disabled={entering}
          className="btn-primary flex-1 flex items-center justify-center gap-2"
        >
          {entering && <Loader2 className="w-4 h-4 animate-spin" />}
          {entering ? "Starting…" : "Play now"}
        </button>
        <button onClick={handleNotYet} disabled={entering} className="btn-ghost flex-1">
          Not yet
        </button>
      </div>
    </div>
  );
};

export default InviteOutcome;
