import { useState, useCallback } from "react";
import TournamentArena from "@/components/tournament/TournamentArena";
import TournamentHistory from "@/components/tournament/TournamentHistory";
import HostTournament from "@/components/tournament/HostTournament";
import TournamentDetailView from "@/components/tournament/TournamentDetailView";
import TournamentLeaderboardView from "@/components/tournament/TournamentLeaderboardView";
import TournamentLockModal from "@/components/tournament/TournamentLockModal";
import { useTournamentStore } from "@/store/tournamentStore";

// ── Feature flag ─────────────────────────────────────────────────────────────
// Flip this to `false` when tournaments are ready for production.
const IS_TOURNAMENT_LOCKED = true;

const Tournament = () => {
  const { view, selectedId, selectedName, setView, selectTournament } =
    useTournamentStore();

  const [lockOpen, setLockOpen] = useState(false);

  // Guard: if locked, show the modal instead of navigating
  const guard = useCallback(
    (action: () => void) => {
      if (IS_TOURNAMENT_LOCKED) {
        setLockOpen(true);
      } else {
        action();
      }
    },
    []
  );

  const handleViewLeaderboard = (id: string) => {
    selectTournament(id, selectedName);
    setView("leaderboard");
  };

  switch (view) {
    case "history":
      return <TournamentHistory onBack={() => setView("arena")} />;

    case "host":
      return <HostTournament onBack={() => setView("arena")} />;

    case "detail":
      return (
        <TournamentDetailView
          tournamentId={selectedId}
          onBack={() => setView("arena")}
          onViewLeaderboard={handleViewLeaderboard}
        />
      );

    case "leaderboard":
      return (
        <TournamentLeaderboardView
          tournamentId={selectedId}
          tournamentName={selectedName}
          onBack={() => setView("detail")}
        />
      );

    default:
      return (
        <>
          <TournamentArena
            onHistoryClick={() => guard(() => setView("history"))}
            onHostClick={() => guard(() => setView("host"))}
            onSelectTournament={(id) => guard(() => selectTournament(id))}
          />
          <TournamentLockModal
            open={lockOpen}
            onClose={() => setLockOpen(false)}
          />
        </>
      );
  }
};

export default Tournament;
