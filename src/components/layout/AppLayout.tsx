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
  type IncomingChallengePayload,
} from "@/lib/socket/events";
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
        // Hydrate sessionStorage so subsequent reads are fast
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

  // Listen for incoming challenges globally
  useEffect(() => {
    onIncomingChallenge((payload) => setIncomingChallenge(payload));
    onPlayersUpdated((payload) => setOnlineCount(payload.onlineCount));
    return () => {
      offIncomingChallenge();
      offPlayersUpdated();
    };
  }, []);

  const activeNav: NavItem =
    PATH_TO_NAV[location.pathname] ?? "lobby";

  const handleNavigate = (item: NavItem) => {
    navigate(NAV_TO_PATH[item]);
  };

  const handleExitConfirm = () => {
    setShowExit(false);
    sessionStorage.removeItem("userProfile");
    navigate("/");
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
        />
        {/* Each child route renders here */}
        <Outlet context={{ userProfile }} />
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
            acceptChallenge(incomingChallenge.challengeId, {
              onSuccess: (res) => {
                if (res.success) {
                  setIncomingChallenge(null);
                  sessionStorage.setItem("currentMatch", JSON.stringify({
                    matchId: res.matchId,
                    player1: { name: userProfile.nickname, avatar: userProfile.avatar },
                    player2: {
                      name: incomingChallenge.challenger.nickname,
                      avatar: incomingChallenge.challenger.avatarUrl,
                    },
                    questions: res.questions,
                  }));
                  navigate("/game");
                }
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
            sendCounter(
              { id: incomingChallenge.challengeId, payload: { newWagerAmount: newAmount } },
              { onSuccess: () => setIncomingChallenge(null) }
            );
          }}
          onClose={() => setIncomingChallenge(null)}
        />
      )}
    </div>
  );
};

export default AppLayout;
