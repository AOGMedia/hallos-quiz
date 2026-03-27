"use client";
import { useState, useEffect, useRef } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import LobbyPlayerCard from "@/components/lobby/LobbyPlayerCard";
import ChallengeModal from "@/components/modals/ChallengeModal";
import ChallengeStatusModal from "@/components/modals/ChallengeStatusModal";
import ChallengeBoardTab from "@/components/lobby/ChallengeBoardTab";
import { soundEngine } from "@/lib/soundEngine";
import { useLobbyPlayers } from "@/hooks/useLobbyPlayers";
import { useCreateChallenge } from "@/hooks/useChallenge";
import type { LobbyPlayer } from "@/lib/api/lobby";
import {
  onChallengeAccepted, offChallengeAccepted,
  onChallengeDeclined, offChallengeDeclined,
  onChallengeTimeout, offChallengeTimeout,
  onChallengeCounter, offChallengeCounter,
} from "@/lib/socket/events";

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
  const [counterOffer, setCounterOffer] = useState<{ amount: number; opponentNickname: string } | null>(null);
  const activeChallengeIdRef = useRef<string | null>(null);

  const { data, isLoading } = useLobbyPlayers(page);
  const { mutate: createChallenge, isPending: isCreatingChallenge } = useCreateChallenge();

  // Listen for challenge lifecycle socket events while in waiting state
  useEffect(() => {
    onChallengeAccepted((payload) => {
      if (activeChallengeIdRef.current && activeChallengeIdRef.current !== payload.challengeId) return;
      soundEngine.stopBellLoop();
      soundEngine.play("start_challenge");
      setModalState("accepted");
      // Store match data for Gameplay
      const stored = sessionStorage.getItem("userProfile");
      const me = stored ? JSON.parse(stored) : { nickname: "You", avatar: "" };
      sessionStorage.setItem("currentMatch", JSON.stringify({
        matchId: payload.matchId,
        player1: { name: me.nickname, avatar: me.avatar },
        player2: { name: payload.opponent.nickname, avatar: payload.opponent.avatarUrl },
        questions: payload.questions,
      }));
      setTimeout(() => navigate("/game"), 1500);
    });

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
      setCounterOffer({ amount: payload.newWagerAmount, opponentNickname: payload.opponentNickname });
      setModalState("counter" as ModalState);
    });

    return () => {
      offChallengeAccepted();
      offChallengeDeclined();
      offChallengeTimeout();
      offChallengeCounter();
    };
  }, [navigate]);

  // Use real players only — no mock fallback (fake data causes confusing challenge failures)
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
              soundEngine.play("start_challenge");
              const stored = sessionStorage.getItem("userProfile");
              const me = stored ? JSON.parse(stored) : { nickname: "You", avatar: "" };
              sessionStorage.setItem("currentMatch", JSON.stringify({
                matchId,
                player1: { name: me.nickname, avatar: me.avatar },
                player2: challenger
                  ? { name: challenger.nickname, avatar: challenger.avatarUrl }
                  : { name: "Opponent", avatar: "" },
                questions: questions ?? [],
              }));
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
          onCancel={closeModal}
          onResend={() => setModalState("waiting")}
          onEditTerms={() => setModalState("challenge")}
          onBackToLobby={closeModal}
          onAcceptCounter={() => {
            if (counterOffer && challengeId) {
              // Accept counter — navigate to game (backend handles match creation)
              closeModal();
            }
          }}
          onDeclineCounter={closeModal}
        />
      )}
    </>
  );
};

export default Lobby;
