import { useState, useEffect } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import Sidebar, { type NavItem } from "./Sidebar";
import TopBar from "./TopBar";
import ExitConfirmModal from "@/components/modals/ExitConfirmModal";
import IncomingChallengeModal from "@/components/modals/IncomingChallengeModal";
import { avatars } from "@/data/gameData";
import { getSocket } from "@/lib/socket/socket";
import {
  onIncomingChallenge,
  offIncomingChallenge,
  onPlayersUpdated,
  offPlayersUpdated,
  onMatchStateRestored,
  offMatchStateRestored,
  type IncomingChallengePayload,
} from "@/lib/socket/events";
import { joinMatch } from "@/lib/socket/emitters";
import { onChatUnreadUpdateScoped } from "@/lib/socket/chatEvents";
import { fetchQuizProfile } from "@/lib/api/quizProfile";
import { useAcceptChallenge, useDeclineChallenge, useCounterOffer } from "@/hooks/useChallenge";
import { useChutaBalance } from "@/hooks/useChutaWallet";
import { useUnreadCount } from "@/hooks/useChat";
import { useChutaWalletStore } from "@/store/chutaWalletStore";
import { useQuizProfileStore } from "@/store/quizProfileStore";
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

function resolveProfile(): { nickname: string; avatar: string } | null {
  try {
    // Primary: sessionStorage (set during registration or previous visit)
    const session = sessionStorage.getItem("userProfile");
    if (session) return JSON.parse(session);

    // Fallback: Zustand localStorage persist (returning registered user)
    const persisted = localStorage.getItem("quiz-profile");
    if (persisted) {
      const { state } = JSON.parse(persisted);
      if (state?.profile?.nickname) {
        const profile = {
          nickname: state.profile.nickname,
          avatar: state.profile.avatarUrl ?? avatars[0],
        };
        sessionStorage.setItem("userProfile", JSON.stringify(profile));
        return profile;
      }
      // isRegistered but no profile object yet — fetch from API on mount
      // Use a placeholder for now; AppLayout will fetch the real profile
      if (state?.isRegistered) {
        const profile = { nickname: "", avatar: avatars[0], needsProfileFetch: true };
        sessionStorage.setItem("userProfile", JSON.stringify(profile));
        return profile;
      }
    }
  } catch {
    // fall through
  }
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

  // Listen for incoming challenges globally
  useEffect(() => {
    if (!hasProfile) return;

    onIncomingChallenge((payload) => setIncomingChallenge(payload));
    onPlayersUpdated((payload) => {
      setOnlineCount(payload.onlineCount);
      useOnlineCountStore.getState().setCount(payload.onlineCount);
    });

    // Global resilience: if server says we are in a match but we are in AppLayout,
    // we ignore it and let the user stay here (they abandoned the match).
    onMatchStateRestored((_match) => {
      // Intentionally ignored — user is in dashboard, not in a game
    });

    return () => {
      offIncomingChallenge();
      offPlayersUpdated();
      offMatchStateRestored();
    };
  }, [location.pathname, navigate, hasProfile, profileNickname]);

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

