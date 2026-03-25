import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import LobbyPlayerCard from "@/components/lobby/LobbyPlayerCard";
import ChallengeModal from "@/components/modals/ChallengeModal";
import ChallengeStatusModal from "@/components/modals/ChallengeStatusModal";
import ExitConfirmModal from "@/components/modals/ExitConfirmModal";
import Tournament from "@/pages/Tournament";
import ChutaWallet from "@/pages/ChutaWallet";
import Identity from "@/pages/Identity";
import { mockPlayers, avatars } from "@/data/gameData";
import { soundEngine } from "@/lib/soundEngine";

type NavItem = "lobby" | "tournament" | "leaderboard" | "cashout" | "identity";
type ModalState = "none" | "challenge" | "confirm" | "waiting" | "timeout" | "rejected" | "accepted" | "exit";

const Lobby = () => {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState({ nickname: "", avatar: avatars[0] });
  const [activeNav, setActiveNav] = useState<NavItem>("lobby");
  const [modalState, setModalState] = useState<ModalState>("none");
  const [selectedPlayer, setSelectedPlayer] = useState<typeof mockPlayers[0] | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Load profile from sessionStorage — redirect to onboarding if missing
  useEffect(() => {
    const stored = sessionStorage.getItem("userProfile");
    if (!stored) {
      navigate("/", { replace: true });
      return;
    }
    setUserProfile(JSON.parse(stored));
  }, [navigate]);

  const handleChallenge = (player: typeof mockPlayers[0]) => {
    setSelectedPlayer(player);
    setModalState("challenge");
    soundEngine.startBellLoop(); // bell rings throughout setup
  };

  const handleChallengeSubmit = (categories: string[]) => {
    setSelectedCategories(categories);
    setModalState("confirm");
  };

  const handleConfirmChallenge = () => {
    setModalState("waiting");
    setTimeout(() => {
      setModalState("accepted");
      setTimeout(() => {
        soundEngine.stopBellLoop();
        soundEngine.play("start_challenge");
        // Save match data so /game page survives refresh
        sessionStorage.setItem("currentMatch", JSON.stringify({
          player1: { name: userProfile.nickname || "You", avatar: userProfile.avatar },
          player2: { name: selectedPlayer!.name, avatar: selectedPlayer!.avatar },
        }));
        setModalState("none");
        navigate("/game");
      }, 2000);
    }, 2000);
  };

  const closeModal = () => {
    soundEngine.stopBellLoop(); // stop bell if user cancels
    setModalState("none");
    setSelectedPlayer(null);
    setSelectedCategories([]);
  };

  const handleExitClick = () => {
    setModalState("exit");
  };

  const handleExitConfirm = () => {
    setModalState("none");
    sessionStorage.removeItem("userProfile");
    navigate("/");
  };

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
        return <ChutaWallet />;
      case "identity":
        return <Identity />;
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
