"use client";
import { useState, useEffect, useRef } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import LobbyPlayerCard from "@/components/lobby/LobbyPlayerCard";
import ChallengeModal from "@/components/modals/ChallengeModal";
import ChallengeStatusModal from "@/components/modals/ChallengeStatusModal";
import ChallengeBoardTab from "@/components/lobby/ChallengeBoardTab";
import { soundEngine } from "@/lib/soundEngine";
import { useLobbyPlayers } from "@/hooks/useLobbyPlayers";
import { useCreateChallenge, useAcceptChallenge, useDeclineChallenge, useCancelChallenge, useActiveMatch } from "@/hooks/useChallenge";
import type { LobbyPlayer } from "@/lib/api/lobby";
import { getSocket } from "@/lib/socket/socket";
import {
  onChallengeAccepted, offChallengeAccepted,
  onChallengeDeclined, offChallengeDeclined,
  onChallengeTimeout, offChallengeTimeout,
  onChallengeCounter, offChallengeCounter,
} from "@/lib/socket/events";
import { joinMatch } from "@/lib/socket/emitters";

type ModalState =
  | "none" | "challenge" | "confirm" | "waiting"
  | "timeout" | "rejected" | "accepted" | "counter";

interface OutletCtx {
  userProfile: { nickname: string; avatar: string };
  searchQuery?: string;
}

const Lobby = () => {
  const navigate = useNavigate();
  const { userProfile, searchQuery = "" } = useOutletContext<OutletCtx>();

  const [lobbyTab, setLobbyTab] = useState<"players" | "challenges">("players");
  const [page, setPage] = useState(1);
  const [modalState, setModalState] = useState<ModalState>("none");
  const [selectedPlayer, setSelectedPlayer] = useState<LobbyPlayer | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [wagerAmount, setWagerAmount] = useState(0);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [challengeError, setChallengeError] = useState<string | null>(null);
  const [counterOffer, setCounterOffer] = useState<{ amount: number; opponentNickname: string; challengeId: string } | null>(null);
  const activeChallengeIdRef = useRef<string | null>(null);

  const { data, isLoading } = useLobbyPlayers(page);
  const { mutate: createChallenge, isPending: isCreatingChallenge } = useCreateChallenge();
  const { mutate: acceptCounterChallenge } = useAcceptChallenge();
  const { mutate: declineCounterChallenge } = useDeclineChallenge();
  const { mutate: cancelChallenge } = useCancelChallenge();

  const { data: activeMatchData } = useActiveMatch();
  // Enable polling for active match only when in waiting/confirm state
  const isPollingForMatch = modalState === "waiting" || modalState === "confirm";

  // Clean stale match data on Lobby mount — prevents zombie redirects
  useEffect(() => {
    const ended = sessionStorage.getItem("matchEnded");
    if (ended === "true") {
      sessionStorage.removeItem("currentMatch");
      sessionStorage.removeItem("matchEnded");
    }
  }, []);

  // Listen for challenge lifecycle socket events
  // Use refs for callbacks so we don't need to re-register on every render
  const navigateRef = useRef(navigate);
  useEffect(() => { navigateRef.current = navigate; }, [navigate]);

  useEffect(() => {
    const getMyId = () => {
      try {
        const token = sessionStorage.getItem("auth_token");
        if (!token) return null;
        return Number(JSON.parse(atob(token.split(".")[1]))?.id);
      } catch { return null; }
    };

    const handleChallengeAccepted = (payload: import("@/lib/socket/events").ChallengeAcceptedPayload) => {
      if (activeChallengeIdRef.current && activeChallengeIdRef.current !== payload.challengeId) return;
      soundEngine.stopBellLoop();
      soundEngine.play("start_challenge");
      setModalState("accepted");
      const stored = sessionStorage.getItem("userProfile");
      const me = stored ? JSON.parse(stored) : { nickname: "You", avatar: "" };
      sessionStorage.removeItem("matchEnded");
      sessionStorage.setItem("currentMatch", JSON.stringify({
        matchId: payload.matchId,
        player1: { name: me.nickname, avatar: me.avatar },
        player2: { name: payload.opponent.nickname, avatar: payload.opponent.avatarUrl },
        questions: payload.questions,
        challengerId: getMyId(),
      }));
      // Join match room immediately so we don't miss opponent_progress events
      joinMatch(payload.matchId);
      setTimeout(() => navigateRef.current("/game"), 1500);
    };

    const registerListeners = () => {
      offChallengeAccepted();
      offChallengeDeclined();
      offChallengeTimeout();
      offChallengeCounter();
      onChallengeAccepted(handleChallengeAccepted);
      onChallengeDeclined((payload) => {
        if (activeChallengeIdRef.current && activeChallengeIdRef.current !== payload.challengeId) return;
        soundEngine.stopBellLoop();
        setModalState("rejected");
      });
      onChallengeTimeout((payload) => {
        if (activeChallengeIdRef.current && activeChallengeIdRef.current !== payload.challengeId) return;
        soundEngine.stopBellLoop();
        setModalState("timeout");
      });
      onChallengeCounter((payload) => {
        if (activeChallengeIdRef.current && activeChallengeIdRef.current !== payload.challengeId) return;
        // Store the counter-offer's new challengeId so we can accept/decline it
        setCounterOffer({ amount: payload.newWagerAmount, opponentNickname: payload.opponentNickname, challengeId: payload.challengeId });
        setModalState("counter" as ModalState);
      });
    };

    registerListeners();

    // Re-register on socket reconnect so we don't miss events after disconnect
    const socket = getSocket();
    socket.on("connect", () => {
      registerListeners();
    });

    return () => {
      socket.off("connect", registerListeners);
      offChallengeAccepted();
      offChallengeDeclined();
      offChallengeTimeout();
      offChallengeCounter();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle auto-start from poll if socket message was missed
  useEffect(() => {
    if (!isPollingForMatch || !activeMatchData?.match) return;

    const match = activeMatchData.match;

    // Safety: don't redirect if match has no questions (stale/incomplete data)
    if (!match.questions || match.questions.length === 0) return;
    if (!match.matchId) return;

    soundEngine.stopBellLoop();
    soundEngine.play("start_challenge");
    setModalState("accepted");

    sessionStorage.removeItem("matchEnded");
    sessionStorage.setItem("currentMatch", JSON.stringify({
      matchId: match.matchId,
      player1: match.matchId ? { name: userProfile.nickname, avatar: userProfile.avatar } : { name: "You", avatar: "" },
      player2: match.challenger 
        ? { name: match.challenger.nickname, avatar: match.challenger.avatarUrl } 
        : { name: "Opponent", avatar: "" },
      questions: match.questions,
      challengerId: match.challengerId,
    }));

    joinMatch(match.matchId);
    setTimeout(() => navigate("/game"), 1500);
  }, [activeMatchData, isPollingForMatch, navigate, userProfile]);

  const players = (data?.players ?? []).filter((p) =>
    searchQuery === "" || p.nickname.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const totalPages = data?.totalPages ?? 1;

  const handleChallenge = (player: LobbyPlayer) => {
    setSelectedPlayer(player);
    setModalState("challenge");
    soundEngine.startBellLoop();
  };

  const handleChallengeSubmit = (payload: { categoryId: string; categoryName: string; wagerAmount: number }) => {
    setSelectedCategories([payload.categoryName]); // display name for UI
    setSelectedCategoryId(payload.categoryId);     // UUID for API
    setWagerAmount(payload.wagerAmount);
    setChallengeError(null);
    setModalState("confirm");
  };

  const handleConfirmChallenge = () => {
    if (!selectedPlayer) return;
    setModalState("waiting");

    createChallenge(
      {
        wagerAmount,
        categoryId: selectedCategoryId,  // real UUID
        opponentId: selectedPlayer.userId,
      },
      {
        onSuccess: (data) => {
          if (data.success) {
            setChallengeId(data.challengeId);
            activeChallengeIdRef.current = data.challengeId;
          } else {
            setChallengeError("Failed to create challenge");
            setModalState("confirm");
          }
        },
        onError: (err) => {
          setChallengeError((err as Error).message ?? "Failed to create challenge");
          setModalState("confirm");
        },
      }
    );
  };

  const handleCancelChallenge = () => {
    if (challengeId) {
      cancelChallenge(challengeId);
    }
    closeModal();
  };

  const closeModal = () => {
    soundEngine.stopBellLoop();
    setModalState("none");
    setSelectedPlayer(null);
    setSelectedCategories([]);
    setSelectedCategoryId("");
    setWagerAmount(0);
    setChallengeId(null);
    setChallengeError(null);
    setCounterOffer(null);
    activeChallengeIdRef.current = null;
  };

  return (
    <>
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-4">
        {/* Tab switcher */}
        <div className="flex gap-1.5">
          {(["players", "challenges"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setLobbyTab(tab)}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-medium border transition-colors ${
                lobbyTab === tab
                  ? "bg-primary border-primary text-primary-foreground"
                  : "bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {tab === "players" ? "Players" : "Challenge Board"}
            </button>
          ))}
        </div>

        {lobbyTab === "players" ? (
          <>
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="card-player animate-pulse h-40 bg-card" />
                ))}
              </div>
            ) : players.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <span className="text-3xl">{searchQuery ? "🔍" : "🎮"}</span>
                </div>
                <p className="text-base font-semibold text-foreground mb-1">
                  {searchQuery ? `No players matching "${searchQuery}"` : "No players online right now"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? "Try a different name" : "Check back soon — the lobby fills up fast"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-stretch justify-items-stretch [&>*]:min-w-0">
                {players.map((player) => (
                  <LobbyPlayerCard
                    key={player.userId}
                    name={player.nickname}
                    avatar={player.avatarUrl}
                    points={Number(player.chutaBalance ?? 0)}
                    wins={player.wins}
                    losses={player.losses}
                    onChallenge={() => handleChallenge(player)}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg text-sm border border-border bg-card text-muted-foreground disabled:opacity-40 hover:bg-muted transition-colors"
                >
                  Prev
                </button>
                <span className="text-sm text-muted-foreground">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg text-sm border border-border bg-card text-muted-foreground disabled:opacity-40 hover:bg-muted transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <ChallengeBoardTab
            onAccept={(challengeId, matchId, challenger, questions) => {
              // Safety check: don't navigate if no questions
              if (!questions || questions.length === 0) {
                console.warn("[Lobby] Challenge accepted but no questions received");
                return;
              }
              soundEngine.play("start_challenge");
              const stored = sessionStorage.getItem("userProfile");
              const me = stored ? JSON.parse(stored) : { nickname: "You", avatar: "" };
              sessionStorage.removeItem("matchEnded");
              sessionStorage.setItem("currentMatch", JSON.stringify({
                matchId,
                player1: { name: me.nickname, avatar: me.avatar },
                player2: challenger
                  ? { name: challenger.nickname, avatar: challenger.avatarUrl }
                  : { name: "Opponent", avatar: "" },
                questions: questions ?? [],
                challengerId: challenger?.userId,
              }));
              // Join match room immediately
              joinMatch(matchId);
              navigate("/game");
            }}
          />
        )}
      </main>

      {modalState === "challenge" && selectedPlayer && (
        <ChallengeModal
          player={{ name: selectedPlayer.nickname, avatar: selectedPlayer.avatarUrl, points: selectedPlayer.chutaBalance ?? 0, form: ["W", "W", "D", "L", "W"] }}
          onClose={closeModal}
          onChallenge={handleChallengeSubmit}
        />
      )}

      {(["confirm", "waiting", "timeout", "rejected", "accepted", "counter"] as ModalState[]).includes(modalState) && selectedPlayer && (
        <ChallengeStatusModal
          type={modalState as "confirm" | "waiting" | "timeout" | "rejected" | "accepted" | "counter"}
          player={{ name: selectedPlayer.nickname, avatar: selectedPlayer.avatarUrl }}
          challenger={{ name: userProfile.nickname || "You", avatar: userProfile.avatar }}
          categories={selectedCategories.length > 0 ? selectedCategories : ["General knowledge"]}
          wagerAmount={wagerAmount}
          counterAmount={counterOffer?.amount}
          onClose={closeModal}
          onConfirm={isCreatingChallenge ? undefined : handleConfirmChallenge}
          error={challengeError}
          onCancel={handleCancelChallenge}
          onResend={() => setModalState("waiting")}
          onEditTerms={() => setModalState("challenge")}
          onBackToLobby={closeModal}
          onTimeout={() => setModalState("timeout")}
          onAcceptCounter={() => {
            if (!counterOffer) return;
            acceptCounterChallenge(counterOffer.challengeId, {
              onSuccess: (res) => {
                if (res.matchId) {
                  closeModal();
                  const stored = sessionStorage.getItem("userProfile");
                  const me = stored ? JSON.parse(stored) : { nickname: "You", avatar: "" };
                  sessionStorage.removeItem("matchEnded");
                  sessionStorage.setItem("currentMatch", JSON.stringify({
                    matchId: res.matchId,
                    player1: { name: me.nickname, avatar: me.avatar },
                    player2: selectedPlayer
                      ? { name: selectedPlayer.nickname, avatar: selectedPlayer.avatarUrl }
                      : { name: counterOffer.opponentNickname, avatar: "" },
                    questions: res.questions ?? [],
                    // In a counter-offer, the opponent who countered is now the challenger
                    challengerId: res.challenger?.userId,
                  }));
                  joinMatch(res.matchId);
                  navigate("/game");
                }
              },
              onError: (err) => {
                setChallengeError((err as Error).message ?? "Failed to accept counter offer");
              },
            });
          }}
          onDeclineCounter={() => {
            if (counterOffer) {
              declineCounterChallenge(counterOffer.challengeId, {
                onSuccess: () => closeModal(),
                onError: () => closeModal(),
              });
            } else {
              closeModal();
            }
          }}
        />
      )}
    </>
  );
};

export default Lobby;
