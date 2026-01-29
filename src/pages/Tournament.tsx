import { useState } from "react";
import TournamentArena from "@/components/tournament/TournamentArena";
import TournamentHistory from "@/components/tournament/TournamentHistory";
import HostTournament from "@/components/tournament/HostTournament";

type TournamentView = "arena" | "history" | "host";

const Tournament = () => {
  const [currentView, setCurrentView] = useState<TournamentView>("arena");

  if (currentView === "history") {
    return <TournamentHistory onBack={() => setCurrentView("arena")} />;
  }

  if (currentView === "host") {
    return <HostTournament onBack={() => setCurrentView("arena")} />;
  }

  return (
    <TournamentArena
      onHistoryClick={() => setCurrentView("history")}
      onHostClick={() => setCurrentView("host")}
    />
  );
};

export default Tournament;
