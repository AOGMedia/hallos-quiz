import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import LobbyPlayerCard from "@/components/lobby/LobbyPlayerCard";
import ChallengeModal from "@/components/modals/ChallengeModal";
import ChallengeStatusModal from "@/components/modals/ChallengeStatusModal";
import ExitConfirmModal from "@/components/modals/ExitConfirmModal";
import Gameplay from "@/pages/Gameplay";
import Tournament from "@/pages/Tournament";
import { mockPlayers } from "@/data/gameData";

interface LobbyProps {
  userProfile: {
    nickname: string;
    avatar: string;
  };
  onExit: () => void;
}

type NavItem = "lobby" | "tournament" | "leaderboard" | "cashout";
type ModalState = "none" | "challenge" | "confirm" | "waiting" | "timeout" | "rejected" | "accepted" | "exit";
type ViewState = "lobby" | "gameplay";

const Lobby = ({ userProfile, onExit }: LobbyProps) => {
  const [activeNav, setActiveNav] = useState<NavItem>("lobby");
  const [modalState, setModalState] = useState<ModalState>("none");
  const [selectedPlayer, setSelectedPlayer] = useState<typeof mockPlayers[0] | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [viewState, setViewState] = useState<ViewState>("lobby");

  const handleChallenge = (player: typeof mockPlayers[0]) => {
    setSelectedPlayer(player);
    setModalState("challenge");
  };

  const handleChallengeSubmit = (categories: string[]) => {
    setSelectedCategories(categories);
    setModalState("confirm");
  };

  const handleConfirmChallenge = () => {
    setModalState("waiting");
    // Simulate waiting and then showing accepted result
    setTimeout(() => {
      setModalState("accepted");
      // After showing accepted, transition to gameplay
      setTimeout(() => {
        setModalState("none");
        setViewState("gameplay");
      }, 2000);
    }, 2000);
  };

  const closeModal = () => {
    setModalState("none");
    setSelectedPlayer(null);
    setSelectedCategories([]);
  };

  const handleReturnToLobby = () => {
    setViewState("lobby");
    setSelectedPlayer(null);
    setSelectedCategories([]);
  };

  const handleExitClick = () => {
    setModalState("exit");
  };

  const handleExitConfirm = () => {
    setModalState("none");
    onExit();
  };

  // Show gameplay view when challenge is accepted
  if (viewState === "gameplay" && selectedPlayer) {
    return (
      <Gameplay
        player1={{
          name: userProfile.nickname || "King_Minkk",
          avatar: userProfile.avatar,
        }}
        player2={{
          name: selectedPlayer.name,
          avatar: selectedPlayer.avatar,
        }}
        onReturnToLobby={handleReturnToLobby}
      />
    );
  }

  // Render content based on active nav
  const renderMainContent = () => {
    switch (activeNav) {
      case "tournament":
        return <Tournament />;
      case "leaderboard":
        return (
          <main className="flex-1 overflow-y-auto p-6">
            <h1 className="text-2xl font-bold text-primary mb-4">Leaderboard</h1>
            <p className="text-muted-foreground">Coming soon...</p>
          </main>
        );
      case "cashout":
        return (
          <main className="flex-1 overflow-y-auto p-6">
            <h1 className="text-2xl font-bold text-primary mb-4">Cashout</h1>
            <p className="text-muted-foreground">Coming soon...</p>
          </main>
        );
      default:
        return (
          <main className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {mockPlayers.map((player) => (
                <LobbyPlayerCard
                  key={player.id}
                  {...player}
                  onChallenge={() => handleChallenge(player)}
                />
              ))}
            </div>
          </main>
        );
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeItem={activeNav} onNavigate={setActiveNav} onExit={handleExitClick} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar
          onlineCount={13078}
          zetaPoints={23000}
          wins={24}
          totalGames={32}
          userAvatar={userProfile.avatar}
        />

        {renderMainContent()}
      </div>

      {/* Challenge Modal */}
      {modalState === "challenge" && selectedPlayer && (
        <ChallengeModal
          player={{
            name: selectedPlayer.name,
            avatar: selectedPlayer.avatar,
            points: selectedPlayer.points,
            form: ["W", "W", "D", "L", "W"],
          }}
          onClose={closeModal}
          onChallenge={handleChallengeSubmit}
        />
      )}

      {/* Challenge Status Modals */}
      {(modalState === "confirm" ||
        modalState === "waiting" ||
        modalState === "timeout" ||
        modalState === "rejected" ||
        modalState === "accepted") &&
        selectedPlayer && (
          <ChallengeStatusModal
            type={modalState}
            player={{
              name: selectedPlayer.name,
              avatar: selectedPlayer.avatar,
            }}
            challenger={{
              name: userProfile.nickname || "King_Minkk",
              avatar: userProfile.avatar,
            }}
            categories={selectedCategories.length > 0 ? selectedCategories : ["General knowledge", "Sports", "Science", "Art", "Finance"]}
            onClose={closeModal}
            onConfirm={handleConfirmChallenge}
            onCancel={closeModal}
            onResend={() => setModalState("waiting")}
            onEditTerms={() => setModalState("challenge")}
            onBackToLobby={closeModal}
          />
        )}

      {/* Exit Confirm Modal */}
      {modalState === "exit" && (
        <ExitConfirmModal
          onClose={closeModal}
          onConfirm={handleExitConfirm}
        />
      )}
    </div>
  );
};

export default Lobby;
