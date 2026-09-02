import { useState, useEffect } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import Sidebar, { type NavItem } from "./Sidebar";
import TopBar from "./TopBar";
import ExitConfirmModal from "@/components/modals/ExitConfirmModal";
import IncomingChallengeModal from "@/components/modals/IncomingChallengeModal";
import { avatars } from "@/data/gameData";
import { getSocket } from "@/lib/socket/socket";
import {
  onIncomingChallengeScoped,
  onChallengeCancelledScoped,
  onPlayersUpdatedScoped,
  onMatchStateRestoredScoped,
  type IncomingChallengePayload,
} from "@/lib/socket/events";
import { joinMatch } from "@/lib/socket/emitters";
import { onChatUnreadUpdateScoped } from "@/lib/socket/chatEvents";
import { fetchQuizProfile } from "@/lib/api/quizProfile";
import { useAcceptChallenge, useDeclineChallenge, useCounterOffer } from "@/hooks/useChallenge";
import { useChutaBalance } from "@/hooks/useChutaWallet";
import { useUnreadCount } from "@/hooks/useChat";
import { useMyActiveTournamentPlay } from "@/hooks/useTournament";
import ActiveTournamentPlayBanner from "@/components/tournament/ActiveTournamentPlayBanner";
import { useChutaWalletStore } from "@/store/chutaWalletStore";
import { useQuizProfileStore, hasQuizProfile } from "@/store/quizProfileStore";
import { useOnlineCountStore } from "@/store/onlineCountStore";
import { useQueryClient } from "@tanstack/react-query";


const PATH_TO_NAV: Record<string, NavItem> = {
  "/lobby":       "lobby",
  "/tournament":  "tournament",
  "/leaderboard": "leaderboard",
  "/chat":        "chat",
  "/wallet":      "cashout",
  "/identity":    "identity",
  "/guide":       "guide",
};

const NAV_TO_PATH: Record<NavItem, string> = {
  lobby:       "/lobby",
  tournament:  "/tournament",
  leaderboard: "/leaderboard",
  chat:        "/chat",
  cashout:     "/wallet",
  identity:    "/identity",
  guide:       "/guide",
};

/**
 * The signed-in user's quiz identity, or null if they haven't set one up.
 *
 * Every source here is verified to belong to the *current* user. These stores
 * are shared across accounts on one browser, and this function previously
 * trusted whatever it found — so signing in as a second user showed the first
 * user's nickname, and a persisted `isRegistered` with no profile produced a
 * blank placeholder identity that the app then rendered as `Player_<id>`.
 */
function resolveProfile(): { nickname: string; avatar: string } | null {
  // hasQuizProfile() confirms the persisted store's owner matches the token.
  if (!hasQuizProfile()) return null;

  try {
    // Primary: sessionStorage (set during registration or previous visit).
    // sessionStorage is per-tab and cleared by clearProfileIfNotOwnedByCurrentUser
    // on startup when it belonged to someone else.
    const session = sessionStorage.getItem("userProfile");
    if (session) {
      const parsed = JSON.parse(session);
      if (parsed?.nickname) return parsed;
    }

    // Fallback: the Zustand store, already owner-verified above.
    const { profile } = useQuizProfileStore.getState();
    if (profile?.nickname) {
      const resolved = {
        nickname: profile.nickname,
        avatar: profile.avatarUrl ?? avatars[0],
      };
      sessionStorage.setItem("userProfile", JSON.stringify(resolved));
      return resolved;
    }
  } catch {
    // fall through
  }
  // Registered per the store but no usable nickname anywhere: treat as not set
  // up rather than inventing a blank identity, so the user is routed to setup.
  return null;
}

const AppLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showExit, setShowExit] = useState(false);
  const [incomingChallenge, setIncomingChallenge] = useState<IncomingChallengePayload | null>(null);
  const [onlineCount, setOnlineCount] = useState(0);
  const [acceptingChallenge, setAcceptingChallenge] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [counterOfferError, setCounterOfferError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { mutate: acceptChallenge } = useAcceptChallenge();
  const { mutate: declineChallenge } = useDeclineChallenge();
  const { mutate: sendCounter } = useCounterOffer();
  const queryClient = useQueryClient();

  // Sidebar chat badge — self-healing 30s poll (see useUnreadCount), plus an
  // immediate cache invalidation on the chat_unread_update socket push for
  // near-instant updates when the socket is healthy. Both hooks are placed
  // above the `if (!profile) return null` guard below (unlike some of this
  // component's pre-existing effects) so they're never called conditionally.
  const { data: unreadData } = useUnreadCount();
  const { data: activePlayData } = useMyActiveTournamentPlay();
  useEffect(() => {
    return onChatUnreadUpdateScoped(() => {
      queryClient.invalidateQueries({ queryKey: ["chat", "unreadCount"] });
    });
  }, [queryClient]);

  // Real balance from API
  useChutaBalance();
  const balance = useChutaWalletStore((s) => s.balance);

  // Real profile stats
  const quizProfile = useQuizProfileStore((s) => s.profile);
  const wins = quizProfile?.lobbyStats?.wins ?? 0;
  const totalGames = (quizProfile?.lobbyStats?.wins ?? 0) + (quizProfile?.lobbyStats?.losses ?? 0);

  const profile = resolveProfile();
  const userProfile = profile;
  // resolveProfile() returns a fresh object each render, so effects below key
  // off these primitives instead of the object identity — otherwise they'd
  // re-run on every single render.
  const hasProfile = !!profile;
  const profileNickname = profile?.nickname ?? "";

  // No profile at all — redirect to onboarding. This has to happen in an
  // effect, not inline during render: navigate() sets state on the router,
  // and doing that mid-render triggers React's "Cannot update a component
  // while rendering a different component" warning.
  useEffect(() => {
    if (!hasProfile) navigate("/", { replace: true });
  }, [hasProfile, navigate]);

  // Eagerly connect socket so the user is marked active in Redis immediately.
  useEffect(() => {
    getSocket();
  }, []);

  // If profile is incomplete (returning user with no cached profile), fetch it from API
  useEffect(() => {
    if (!hasProfile) return;
    if (profileNickname) return; // already have it
    try {
      const token = sessionStorage.getItem("auth_token");
      if (!token) return;
      // Decode userId from JWT payload (base64)
      const payload = JSON.parse(atob(token.split(".")[1]));
      const userId = payload?.id;
      if (!userId) return;
      fetchQuizProfile(userId).then((res) => {
        if (res.profile) {
          const p = {
            nickname: res.profile.nickname,
            avatar: res.profile.avatarUrl ?? avatars[0],
          };
          sessionStorage.setItem("userProfile", JSON.stringify(p));
          // Update Zustand store
          useQuizProfileStore.getState().setProfile(res.profile);
        }
      }).catch(() => {});
    } catch {
      // ignore
    }
  }, [hasProfile, profileNickname]);

  // Listen for incoming challenges globally.
  //
  // Mounted once for the whole session, deliberately. This effect used to
  // depend on `location.pathname` and `profileNickname`, so it tore down and
  // re-registered on every navigation and again the moment a returning user's
  // nickname resolved. Because the cleanup used the by-name helpers
  // (offIncomingChallenge -> socket.off("challenge_received")), which remove
  // EVERY listener for an event rather than just this one, any challenge that
  // arrived inside that teardown window was dropped entirely: the modal simply
  // never appeared and the user had to refresh to see it. Scoped subscriptions
  // plus an empty dependency array mean the listener is bound once and stays
  // bound, so an inbound challenge is always caught.
  //
  // The `hasProfile` guard was also removed: it delayed registration until the
  // profile resolved, leaving a window where challenges were missed. State
  // setters are safe to call regardless, and the modal only renders once
  // userProfile exists.
  useEffect(() => {
    const unsubChallenge = onIncomingChallengeScoped((payload) => setIncomingChallenge(payload));

    // The challenger withdrew before we answered. The server has always sent
    // this and nothing ever listened, so the invite modal stayed on screen for
    // a challenge that no longer existed — accepting it just failed with an
    // error. Dismiss it, but only if it's the one currently being shown.
    const unsubCancelled = onChallengeCancelledScoped(({ challengeId }) => {
      setIncomingChallenge((current) =>
        current && current.challengeId === challengeId ? null : current
      );
    });

    const unsubPlayers = onPlayersUpdatedScoped((payload) => {
      setOnlineCount(payload.onlineCount);
      useOnlineCountStore.getState().setCount(payload.onlineCount);
    });
    // Global resilience: if server says we are in a match but we are in AppLayout,
    // we ignore it and let the user stay here (they abandoned the match).
    const unsubRestored = onMatchStateRestoredScoped(() => {
      // Intentionally ignored — user is in dashboard, not in a game
    });

    return () => {
      unsubChallenge();
      unsubCancelled();
      unsubPlayers();
      unsubRestored();
    };
  }, []);

  // If user navigates ANYWHERE within AppLayout, they are by definition not in a game.
  // Erase any lingering match state.
  useEffect(() => {
    sessionStorage.removeItem("currentMatch");
    sessionStorage.removeItem("matchEnded");
  }, [location.pathname]);

  // Every hook above runs unconditionally — this guard must stay below all of
  // them so hook order is identical on every render.
  if (!userProfile) return null;

  const activeNav: NavItem =
    PATH_TO_NAV[location.pathname] ?? "lobby";

  const handleNavigate = (item: NavItem) => {
    navigate(NAV_TO_PATH[item]);
  };

  const handleExitConfirm = () => {
    setShowExit(false);
    sessionStorage.removeItem("userProfile");
    sessionStorage.removeItem("auth_token");
    sessionStorage.removeItem("currentMatch");
    sessionStorage.removeItem("matchEnded");
    const parentUrl = import.meta.env.VITE_PARENT_APP_URL ?? "https://www.hallos.net";
    window.location.href = `${parentUrl}/dashboard`;
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        activeItem={activeNav}
        onNavigate={handleNavigate}
        onExit={() => setShowExit(true)}
        unreadCount={unreadData?.unreadCount}
        hasActivePlay={!!activePlayData && activePlayData.type !== "none"}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          onlineCount={onlineCount}
          zetaPoints={balance}
          wins={wins}
          totalGames={totalGames}
          userAvatar={userProfile.avatar}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
        <ActiveTournamentPlayBanner />
        {/* Each child route renders here */}
        <Outlet context={{ userProfile, searchQuery }} />
      </div>

      {showExit && (
        <ExitConfirmModal
          onClose={() => setShowExit(false)}
          onConfirm={handleExitConfirm}
        />
      )}

      {incomingChallenge && (
        <IncomingChallengeModal
          challenger={{
            name: incomingChallenge.challenger.nickname,
            avatar: incomingChallenge.challenger.avatarUrl,
            points: incomingChallenge.challenger.chutaBalance,
          }}
          me={{ name: userProfile.nickname, avatar: userProfile.avatar }}
          categories={[incomingChallenge.categoryName]}
          wagerAmount={incomingChallenge.wagerAmount}
          expiresInSeconds={Math.max(
            0,
            Math.floor((new Date(incomingChallenge.expiresAt).getTime() - Date.now()) / 1000)
          )}
          onAccept={() => {
            if (acceptingChallenge) return;
            setAcceptingChallenge(true);
            setAcceptError(null);
            acceptChallenge(incomingChallenge.challengeId, {
              onSuccess: (res) => {
                setAcceptingChallenge(false);
                // Navigate as long as we have a matchId — don't rely solely on success flag
                if (res.matchId) {
                  setIncomingChallenge(null);
                  sessionStorage.removeItem("matchEnded");
                  sessionStorage.setItem("currentMatch", JSON.stringify({
                    matchId: res.matchId,
                    player1: { name: userProfile.nickname, avatar: userProfile.avatar },
                    player2: {
                      userId: incomingChallenge.challenger.userId,
                      name: incomingChallenge.challenger.nickname,
                      avatar: incomingChallenge.challenger.avatarUrl,
                    },
                    questions: res.questions ?? [],
                    challengerId: incomingChallenge.challenger.userId,
                  }));
                  // Join match room immediately so we don't miss opponent_progress events
                  joinMatch(res.matchId);
                  navigate("/game");
                } else {
                  setAcceptError("Could not start match — challenge may have expired");
                }
              },
              onError: (err) => {
                setAcceptingChallenge(false);
                // Even on error, if it's a network blip the match may have started
                // Show error but don't close modal so user can retry
                setAcceptError((err as Error).message ?? "Failed to accept — please try again");
              },
            });
          }}
          onDecline={() => {
            declineChallenge(incomingChallenge.challengeId, {
              onSuccess: () => setIncomingChallenge(null),
              onError: () => setIncomingChallenge(null),
            });
          }}
          onCounter={(newAmount) => {
            setCounterOfferError(null);
            sendCounter(
              { id: incomingChallenge.challengeId, payload: { newWagerAmount: newAmount } },
              {
                onSuccess: () => { setIncomingChallenge(null); setCounterOfferError(null); },
                onError: (err) => setCounterOfferError((err as Error).message ?? "Failed to send counter offer"),
              }
            );
          }}
          onClose={() => { setIncomingChallenge(null); setAcceptError(null); setAcceptingChallenge(false); }}
          counterError={counterOfferError}
          acceptError={acceptError}
          isAccepting={acceptingChallenge}
        />
      )}
    </div>
  );
};

export default AppLayout;

