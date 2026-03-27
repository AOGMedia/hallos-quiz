import TournamentArena from "@/components/tournament/TournamentArena";
import TournamentHistory from "@/components/tournament/TournamentHistory";
import HostTournament from "@/components/tournament/HostTournament";
import TournamentDetailView from "@/components/tournament/TournamentDetailView";
import TournamentLeaderboardView from "@/components/tournament/TournamentLeaderboardView";
import { useTournamentStore } from "@/store/tournamentStore";

const Tournament = () => {
  const { view, selectedId, selectedName, setView, selectTournament } =
    useTournamentStore();

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
        <TournamentArena
          onHistoryClick={() => setView("history")}
          onHostClick={() => setView("host")}
          onSelectTournament={selectTournament}
        />
      );
  }
};

export default Tournament;
