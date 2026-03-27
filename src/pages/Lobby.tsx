"use client";
import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import LobbyPlayerCard from "@/components/lobby/LobbyPlayerCard";
import ChallengeModal from "@/components/modals/ChallengeModal";
import ChallengeStatusModal from "@/components/modals/ChallengeStatusModal";
import ChallengeBoardTab from "@/components/lobby/ChallengeBoardTab";
import { soundEngine } from "@/lib/soundEngine";
import { useLobbyPlayers } from "@/hooks/useLobbyPlayers";
import { useCreateChallenge } from "@/hooks/useChallenge";
import { mockPlayers } from "@/data/gameData";
import type { LobbyPlayer } from "@/lib/api/lobby";

type ModalState =
  | "none" | "challenge" | "confirm" | "waiting"
  | "timeout" | "rejected" | "accepted";

interface OutletCtx {
  userProfile: { nickname: string; avatar: string };
}

const Lobby = () => {
  const navigate = useNavigate();
  const { userProfile } = useOutletContext<OutletCtx>();

  const [lobbyTab, setLobbyTab] = useState<"players" | "challenges">("players");
  const [page, setPage] = useState(1);
  const [modalState, setModalState] = useState<ModalState>("none");
  const [selectedPlayer, setSelectedPlayer] = useState<LobbyPlayer | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [wagerAmount, setWagerAmount] = useState(0);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [challengeError, setChallengeError] = useState<string | null>(null);

  const { data, isLoading, isError } = useLobbyPlayers(page);
  const { mutate: createChallenge, isPending: isCreatingChallenge } = useCreateChallenge();

  // Use real players if available, fall back to mock data so the UI is never empty
  const mockFallback: LobbyPlayer[] = mockPlayers.map((p, i) => ({
    userId: i + 1,
    nickname: p.name,
    avatarUrl: p.avatar,
    wins: p.wins,
    losses: p.losses,
    winRate: Math.round((p.wins / (p.wins + p.losses)) * 100),
    chutaBalance: p.points,
  }));

  const players = (data?.players && data.players.length > 0) ? data.players : (!isLoading ? mockFallback : []);
  const totalPages = data?.totalPages ?? 1;

  const handleChallenge = (player: LobbyPlayer) => {
    setSelectedPlayer(player);
    setModalState("challenge");
    soundEngine.startBellLoop();
  };

  const handleChallengeSubmit = (payload: { categoryId: string; categoryName: string; wagerAmount: number }) => {
    setSelectedCategories([payload.categoryName]);
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
        categoryId: selectedCategories[0],
        opponentId: selectedPlayer.userId,
      },
      {
        onSuccess: (data) => {
          if (data.success) {
            setChallengeId(data.challengeId);
            // Challenge sent — stay in waiting state until opponent responds
            // (WebSocket event or polling will update this when available)
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
    setWagerAmount(0);
    setChallengeId(null);
    setChallengeError(null);
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
            onAccept={(challengeId, matchId) => {
              soundEngine.play("start_challenge");
              sessionStorage.setItem("currentMatch", JSON.stringify({
                matchId,
                player1: { name: userProfile.nickname || "You", avatar: userProfile.avatar },
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

      {(["confirm", "waiting", "timeout", "rejected", "accepted"] as ModalState[]).includes(modalState) && selectedPlayer && (
        <ChallengeStatusModal
          type={modalState as "confirm" | "waiting" | "timeout" | "rejected" | "accepted"}
          player={{ name: selectedPlayer.nickname, avatar: selectedPlayer.avatarUrl }}
          challenger={{ name: userProfile.nickname || "You", avatar: userProfile.avatar }}
          categories={selectedCategories.length > 0 ? selectedCategories : ["General knowledge", "Sports", "Science", "Art", "Finance"]}
          wagerAmount={wagerAmount}
          onClose={closeModal}
          onConfirm={isCreatingChallenge ? undefined : handleConfirmChallenge}
          error={challengeError}
          onCancel={closeModal}
          onResend={() => setModalState("waiting")}
          onEditTerms={() => setModalState("challenge")}
          onBackToLobby={closeModal}
        />
      )}
    </>
  );
};

export default Lobby;
