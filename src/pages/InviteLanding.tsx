import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, LinkIcon, UserCog, LogIn } from "lucide-react";
import AahbibiLogo from "@/components/icons/AahbibiLogo";
import InviterCard from "@/components/invite/InviterCard";
import InviteOutcome from "@/components/invite/InviteOutcome";
import { useResolveInvite, useClaimInvite } from "@/hooks/useInvite";
import {
  redirectToSignin,
  type ClaimInviteResponse,
  type ResolveInviteError,
} from "@/lib/api/invite";
import {
  setPendingInvite,
  clearPendingInvite,
  markClaimStarted,
  releaseClaim,
  cacheClaimResult,
  getCachedClaimResult,
} from "@/lib/invite/pendingInvite";
import { getToken } from "@/store/authStore";
import { hasQuizProfile } from "@/store/quizProfileStore";

const Shell = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-background relative flex flex-col">
    <div className="absolute inset-0 glow-top pointer-events-none" />
    <div className="flex-1 flex items-center justify-center px-4 py-12 relative z-10">
      <div className="w-full max-w-md space-y-6">
        <AahbibiLogo className="h-9 justify-center mx-auto" />
        {children}
      </div>
    </div>
  </div>
);

const InviteLanding = () => {
  const { token = "" } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const { data: resolved, isLoading, isError, error: resolveError } = useResolveInvite(token);
  const { mutate: claim } = useClaimInvite();

  // Seed from the module cache so a StrictMode remount doesn't lose the result.
  const [claimResult, setClaimResult] = useState<ClaimInviteResponse | null>(() =>
    getCachedClaimResult<ClaimInviteResponse>(token)
  );
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  // Stash the token so it survives the round trip through hallos.net signin.
  useEffect(() => {
    if (token) setPendingInvite(token);
  }, [token]);

  const isAuthed = !!getToken();
  const isRegistered = hasQuizProfile();
  const canClaim = !!token && isAuthed && isRegistered && !!resolved?.found;

  // Claim once we have BOTH a session and a completed quiz profile. Claiming any
  // earlier would permanently resolve the invite to `pending_notify` — the server
  // never re-runs a claim, so the friend could never be auto-matched from it.
  // `claimError` is part of the guard on purpose: without it, clearing `claiming`
  // on failure would re-trigger this effect and claim in a tight loop against a
  // rate-limited endpoint. A failed claim waits for the explicit Retry button.
  useEffect(() => {
    if (!canClaim || claimResult || claiming || claimError) return;
    if (!markClaimStarted(token)) return;

    setClaiming(true);
    claim(token, {
      onSuccess: (res) => {
        clearPendingInvite();
        cacheClaimResult(token, res);
        setClaimResult(res);
        setClaiming(false);
      },
      onError: (err) => {
        setClaimError((err as Error).message ?? "Could not open this invite.");
        setClaiming(false);
      },
    });
  }, [canClaim, claimResult, claiming, claimError, claim, token]);

  const handleRetryClaim = () => {
    releaseClaim(token);
    setClaimError(null);
  };

  // ── Resolving ─────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <Shell>
        <div className="flex flex-col items-center gap-3 py-8">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Opening your invite…</p>
        </div>
      </Shell>
    );
  }

  // Resolve came back needing auth — the endpoint is documented as public, but
  // don't tell the user their link is broken when it's really the session.
  // Signing in returns them here, and the claim then runs normally.
  const resolveStatus = (resolveError as ResolveInviteError | null)?.status;
  if (isError && (resolveStatus === 401 || resolveStatus === 403) && !getToken()) {
    return (
      <Shell>
        <div className="bg-card border border-border rounded-2xl p-6 text-center space-y-4">
          <h1 className="text-lg font-bold text-foreground">You've been invited to play</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to see who invited you and join the game.
          </p>
          <button
            onClick={() => redirectToSignin(token)}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            Sign in to play
          </button>
        </div>
      </Shell>
    );
  }

  // ── Dead link — a 404 is a typo'd/tampered link, not an error state ───────
  // `!resolved.inviter` also lands here: every screen below reads it, so a
  // response missing it degrades to this instead of a blank page.
  if (isError || !resolved?.found || !resolved?.inviter) {
    return (
      <Shell>
        <div className="bg-card border border-border rounded-2xl p-6 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto">
            <LinkIcon className="w-6 h-6 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">This invite link is invalid</h1>
            <p className="text-sm text-muted-foreground mt-1">
              It may have been mistyped or already used. Ask your friend for a new one.
            </p>
          </div>
          <button onClick={() => navigate("/lobby")} className="btn-primary w-full">
            Go to Hallos Quiz
          </button>
        </div>
      </Shell>
    );
  }

  const { inviter, wagerAmount, categoryName, valid, recipientHasAccount } = resolved;

  return (
    <Shell>
      <InviterCard
        nickname={inviter.nickname}
        avatarUrl={inviter.avatarUrl}
        online={inviter.online}
        wagerAmount={wagerAmount}
        categoryName={categoryName}
        // Expired/revoked links must not promise an instant match.
        showMatchPromise={valid}
      />

      {!valid && (
        <p className="text-xs text-warning text-center px-2">
          This invite link is no longer active, but you can still sign in and play.
        </p>
      )}

      {/* Logged out — never touch the socket here, it would cache an empty token */}
      {!isAuthed && (
        <button
          onClick={() => redirectToSignin(token)}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          <LogIn className="w-4 h-4" />
          {recipientHasAccount === false ? "Sign up to play" : "Sign in to play"}
        </button>
      )}

      {/* Signed in but hasn't finished quiz onboarding — token stays pending */}
      {isAuthed && !isRegistered && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground text-center">
            Set up your game identity to accept this invite.
          </p>
          <button
            onClick={() => navigate("/profile")}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            <UserCog className="w-4 h-4" />
            Set up your game identity
          </button>
        </div>
      )}

      {isAuthed && isRegistered && claiming && (
        <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Accepting invite…
        </div>
      )}

      {claimError && (
        <div className="space-y-3">
          <p className="text-xs text-destructive text-center">{claimError}</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={handleRetryClaim} className="btn-primary flex-1">
              Try again
            </button>
            <button onClick={() => navigate("/lobby")} className="btn-ghost flex-1">
              Go to lobby
            </button>
          </div>
        </div>
      )}

      {claimResult && (
        <InviteOutcome
          claim={claimResult}
          inviter={inviter}
          wagerAmount={wagerAmount}
          categoryName={categoryName}
        />
      )}
    </Shell>
  );
};

export default InviteLanding;
