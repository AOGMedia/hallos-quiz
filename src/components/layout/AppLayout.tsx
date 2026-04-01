import { useState, useEffect } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
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
import { useAcceptChallenge, useDeclineChallenge, useCounterOffer } from "@/hooks/useChallenge";
import { useChutaBalance } from "@/hooks/useChutaWallet";
import { useChutaWalletStore } from "@/store/chutaWalletStore";
import { useQuizProfileStore } from "@/store/quizProfileStore";

type NavItem = "lobby" | "tournament" | "leaderboard" | "cashout" | "identity";

const PATH_TO_NAV: Record<string, NavItem> = {
  "/lobby":       "lobby",
  "/tournament":  "tournament",
  "/leaderboard": "leaderboard",
  "/wallet":      "cashout",
  "/identity":    "identity",
};

const NAV_TO_PATH: Record<NavItem, string> = {
  lobby:       "/lobby",
  tournament:  "/tournament",
  leaderboard: "/leaderboard",
  cashout:     "/wallet",
  identity:    "/identity",
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

  // Real balance from API
  useChutaBalance();
  const balance = useChutaWalletStore((s) => s.balance);

  // Real profile stats
  const quizProfile = useQuizProfileStore((s) => s.profile);
  const wins = quizProfile?.lobbyStats?.wins ?? 0;
  const totalGames = (quizProfile?.lobbyStats?.wins ?? 0) + (quizProfile?.lobbyStats?.losses ?? 0);

  const profile = resolveProfile();

  // No profile at all — redirect to onboarding
  if (!profile) {
    navigate("/", { replace: true });
    return null;
  }

  const userProfile = profile;

  // Eagerly connect socket so the user is marked active in Redis immediately.
  useEffect(() => {
    getSocket();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // If profile is incomplete (returning user with no cached profile), fetch it from API
  useEffect(() => {
    if (userProfile.nickname) return; // already have it
    try {
      const token = sessionStorage.getItem("auth_token");
      if (!token) return;
      // Decode userId from JWT payload (base64)
      const payload = JSON.parse(atob(token.split(".")[1]));
      const userId = payload?.id;
      if (!userId) return;
      import("@/lib/api/quizProfile").then(({ fetchQuizProfile }) => {
        fetchQuizProfile(userId).then((res) => {
          if (res.profile) {
            const p = {
              nickname: res.profile.nickname,
              avatar: res.profile.avatarUrl ?? avatars[0],
            };
            sessionStorage.setItem("userProfile", JSON.stringify(p));
            // Update Zustand store
            import("@/store/quizProfileStore").then(({ useQuizProfileStore }) => {
              useQuizProfileStore.getState().setProfile(res.profile);
            });
          }
        }).catch(() => {});
      });
    } catch {
      // ignore
    }
  }, [userProfile.nickname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for incoming challenges globally
  useEffect(() => {
    onIncomingChallenge((payload) => setIncomingChallenge(payload));
    onPlayersUpdated((payload) => setOnlineCount(payload.onlineCount));
    
    // Global resilience: if server says we are in a match, go there!
    onMatchStateRestored((match) => {
      if (location.pathname === "/game") return; // already there
      if (location.pathname === "/lobby") return; // don't hijack user from lobby
      if (sessionStorage.getItem("matchEnded") === "true") return; // match already ended locally
      
      console.log("[AppLayout] Match state restored, auto-navigating to /game");
      sessionStorage.removeItem("matchEnded");
      sessionStorage.setItem("currentMatch", JSON.stringify({
        matchId: match.matchId,
        player1: { name: userProfile.nickname, avatar: userProfile.avatar },
        player2: match.opponent 
          ? { name: match.opponent.nickname, avatar: match.opponent.avatarUrl } 
          : { name: "Opponent", avatar: "" },
        questions: match.questions,
        challengerId: match.challengerId,
      }));
      navigate("/game");
    });

    return () => {
      offIncomingChallenge();
      offPlayersUpdated();
      offMatchStateRestored();
    };
  }, [location.pathname, navigate, userProfile]);
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

