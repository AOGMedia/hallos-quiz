import { useState } from "react";
import { Trophy, Globe, Swords, Users, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import GlobalTab from "@/components/leaderboard/GlobalTab";
import LobbyTab from "@/components/leaderboard/LobbyTab";
import TournamentTab from "@/components/leaderboard/TournamentTab";
import {
  useGlobalLeaderboard,
  useLobbyLeaderboard,
  useTournamentLeaderboard,
} from "@/hooks/useLeaderboard";
import { useOnlineCountStore } from "@/store/onlineCountStore";

type LeaderboardTab = "global" | "lobby" | "tournament";

const PAGE_SIZE = 20;

const TABS: { id: LeaderboardTab; label: string; icon: typeof Globe }[] = [
  { id: "global",     label: "Global",     icon: Globe   },
  { id: "lobby",      label: "Lobby",      icon: Swords  },
  { id: "tournament", label: "Tournament", icon: Trophy  },
];

const Pagination = ({
  page, totalPages, onPrev, onNext,
}: { page: number; totalPages: number; onPrev: () => void; onNext: () => void }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-3 mt-4">
      <button
        onClick={onPrev}
        disabled={page === 1}
        className="p-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="text-xs text-muted-foreground">
        Page <span className="font-semibold text-foreground">{page}</span> of {totalPages}
      </span>
      <button
        onClick={onNext}
        disabled={page === totalPages}
        className="p-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

// ── Skeleton loader ───────────────────────────────────────────────────────────

const SkeletonRows = () => (
  <div className="bg-card border border-border rounded-xl overflow-hidden">
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className={`flex items-center gap-3 px-3 sm:px-4 py-3 ${i < 7 ? "border-b border-border" : ""}`}>
        <div className="w-6 h-4 bg-muted rounded animate-pulse" />
        <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
        <div className="flex-1 h-4 bg-muted rounded animate-pulse" />
        <div className="w-16 h-4 bg-muted rounded animate-pulse" />
      </div>
    ))}
  </div>
);

// ── Main page ─────────────────────────────────────────────────────────────────

const Leaderboard = () => {
  const [activeTab, setActiveTab] = useState<LeaderboardTab>("global");
  const [globalPage, setGlobalPage] = useState(1);
  const [lobbyPage, setLobbyPage] = useState(1);
  const [tournamentPage, setTournamentPage] = useState(1);

  const globalQuery    = useGlobalLeaderboard();
  const lobbyQuery     = useLobbyLeaderboard();
  const tournamentQuery = useTournamentLeaderboard();
  const activeCount    = useOnlineCountStore((s) => s.count);

  const globalRankings     = globalQuery.data?.rankings     ?? [];
  const lobbyRankings      = lobbyQuery.data?.rankings      ?? [];
  const tournamentRankings = tournamentQuery.data?.rankings ?? [];
  const userRank           = globalQuery.data?.userRank     ?? 0;
  const totalPlayers       = globalQuery.data?.totalPlayers ?? 0;

  // Paginated slices
  const globalTotalPages     = Math.max(1, Math.ceil(globalRankings.length / PAGE_SIZE));
  const lobbyTotalPages      = Math.max(1, Math.ceil(lobbyRankings.length / PAGE_SIZE));
  const tournamentTotalPages = Math.max(1, Math.ceil(tournamentRankings.length / PAGE_SIZE));

  const pagedGlobal     = globalRankings.slice((globalPage - 1) * PAGE_SIZE, globalPage * PAGE_SIZE);
  const pagedLobby      = lobbyRankings.slice((lobbyPage - 1) * PAGE_SIZE, lobbyPage * PAGE_SIZE);
  const pagedTournament = tournamentRankings.slice((tournamentPage - 1) * PAGE_SIZE, tournamentPage * PAGE_SIZE);

  const handleTabChange = (tab: LeaderboardTab) => {
    setActiveTab(tab);
    // Reset page on tab switch
    if (tab === "global") setGlobalPage(1);
    if (tab === "lobby") setLobbyPage(1);
    if (tab === "tournament") setTournamentPage(1);
  };

  const isLoading =
    (activeTab === "global"     && globalQuery.isLoading) ||
    (activeTab === "lobby"      && lobbyQuery.isLoading) ||
    (activeTab === "tournament" && tournamentQuery.isLoading);

  const isError =
    (activeTab === "global"     && globalQuery.isError) ||
    (activeTab === "lobby"      && lobbyQuery.isError) ||
    (activeTab === "tournament" && tournamentQuery.isError);

  const refetch = () => {
    if (activeTab === "global")     globalQuery.refetch();
    if (activeTab === "lobby")      lobbyQuery.refetch();
    if (activeTab === "tournament") tournamentQuery.refetch();
  };

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-primary mb-1">Leaderboard</h1>
          <p className="text-xs sm:text-base text-muted-foreground">
            Top players ranked by Morgan Points earned
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Active users badge */}
          <div className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-xl">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <Users className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs sm:text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{activeCount.toLocaleString()}</span> online
            </span>
          </div>

          {/* Refresh */}
          <button
            onClick={refetch}
            disabled={isLoading}
            className="p-2 rounded-lg bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-40"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Top 3 podium — global only */}
      {activeTab === "global" && globalRankings.length >= 3 && (
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6 sm:mb-8 max-w-lg mx-auto">
          {/* 2nd */}
          <div className="flex flex-col items-center gap-2 pt-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-400/20 border-2 border-gray-400 flex items-center justify-center text-sm font-bold text-gray-400">
              {(globalRankings[1].nickname ?? globalRankings[1].username ?? "?").charAt(0)}
            </div>
            <div className="w-full bg-gray-400/20 border border-gray-400/30 rounded-t-lg py-3 sm:py-4 text-center">
              <p className="text-[10px] sm:text-xs font-semibold text-foreground truncate px-1">{globalRankings[1].nickname ?? globalRankings[1].username}</p>
              <p className="text-[10px] text-muted-foreground">🥈</p>
            </div>
          </div>

          {/* 1st */}
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-yellow-500/20 border-2 border-yellow-400 flex items-center justify-center text-base font-bold text-yellow-400">
              {(globalRankings[0].nickname ?? globalRankings[0].username ?? "?").charAt(0)}
            </div>
            <div className="w-full bg-yellow-500/10 border border-yellow-500/30 rounded-t-lg py-4 sm:py-6 text-center">
              <p className="text-[10px] sm:text-xs font-semibold text-foreground truncate px-1">{globalRankings[0].nickname ?? globalRankings[0].username}</p>
              <p className="text-[10px] text-muted-foreground">🥇</p>
            </div>
          </div>

          {/* 3rd */}
          <div className="flex flex-col items-center gap-2 pt-6">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-amber-700/20 border-2 border-amber-700 flex items-center justify-center text-xs font-bold text-amber-600">
              {(globalRankings[2].nickname ?? globalRankings[2].username ?? "?").charAt(0)}
            </div>
            <div className="w-full bg-amber-700/10 border border-amber-700/30 rounded-t-lg py-2 sm:py-3 text-center">
              <p className="text-[10px] sm:text-xs font-semibold text-foreground truncate px-1">{globalRankings[2].nickname ?? globalRankings[2].username}</p>
              <p className="text-[10px] text-muted-foreground">🥉</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1.5 mb-5 sm:mb-6 overflow-x-auto scrollbar-hide pb-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => handleTabChange(id)}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 border ${
              activeTab === id
                ? "bg-primary border-primary text-primary-foreground"
                : "bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* API error banner */}
      {isError && (
        <div className="mb-4 px-3 py-2 bg-warning/10 border border-warning/20 rounded-lg text-[10px] sm:text-xs text-warning">
          API unavailable — showing sample data
        </div>
      )}

      {/* Tab content */}
      {isLoading ? (
        <SkeletonRows />
      ) : (
        <div className="min-h-[400px]">
          {activeTab === "global" && globalQuery.data && (
            <>
              <GlobalTab rankings={pagedGlobal} userRank={userRank} totalPlayers={totalPlayers} />
              <Pagination page={globalPage} totalPages={globalTotalPages} onPrev={() => setGlobalPage(p => p - 1)} onNext={() => setGlobalPage(p => p + 1)} />
            </>
          )}
          {activeTab === "lobby" && (
            <>
              <LobbyTab rankings={pagedLobby} />
              <Pagination page={lobbyPage} totalPages={lobbyTotalPages} onPrev={() => setLobbyPage(p => p - 1)} onNext={() => setLobbyPage(p => p + 1)} />
            </>
          )}
          {activeTab === "tournament" && (
            <>
              <TournamentTab rankings={pagedTournament} />
              <Pagination page={tournamentPage} totalPages={tournamentTotalPages} onPrev={() => setTournamentPage(p => p - 1)} onNext={() => setTournamentPage(p => p + 1)} />
            </>
          )}

          {/* Fallback if no data and not loading */}
          {!isLoading && activeTab === "lobby" && lobbyRankings.length === 0 && !lobbyQuery.isError && (
             <div className="text-center py-20 bg-card border border-dashed border-border rounded-xl">
               <Swords className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
               <p className="text-muted-foreground">Waiting for more matches to be played...</p>
             </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
