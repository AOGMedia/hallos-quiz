import { useState } from "react";
import { History, Plus, Zap, Swords, Timer, Crown, GraduationCap, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import TournamentCard from "./TournamentCard";
import { useTournaments } from "@/hooks/useTournament";
import { tournaments as mockTournaments, featuredTournament } from "@/data/tournamentData";
import { FORMAT_LABELS, type TournamentFormat } from "@/lib/api/tournament";
import tournamentBg from "@/assets/tournament-bg.png";

type FilterFormat = "all" | TournamentFormat;

interface TournamentArenaProps {
  onHistoryClick: () => void;
  onHostClick: () => void;
  onSelectTournament: (id: string) => void;
}

const FILTERS: { id: FilterFormat; label: string; icon?: React.ElementType }[] = [
  { id: "all",          label: "All Formats" },
  { id: "battle_royale",label: FORMAT_LABELS.battle_royale, icon: Swords },
  { id: "speed_run",    label: FORMAT_LABELS.speed_run,     icon: Timer },
  { id: "knockout",     label: FORMAT_LABELS.knockout,      icon: Crown },
  { id: "classic",      label: FORMAT_LABELS.classic,       icon: GraduationCap },
];

const TournamentArena = ({ onHistoryClick, onHostClick, onSelectTournament }: TournamentArenaProps) => {
  const [activeFilter, setActiveFilter] = useState<FilterFormat>("all");

  const { data, isLoading, isError, refetch } = useTournaments(
    activeFilter !== "all" ? { format: activeFilter } : {}
  );

  // Adapt mock data to API shape for fallback display
  const apiTournaments = data?.tournaments ?? [];
  const showMock = !isLoading && apiTournaments.length === 0;

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-primary mb-1 sm:mb-2">Tournament Arena</h1>
          <p className="text-xs sm:text-base text-muted-foreground">
            Compete for Chuta points (CP) and exchange your winnings for real rewards
          </p>
        </div>
        <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
          <Button variant="outline" onClick={onHistoryClick}
            className="bg-card border-border hover:bg-muted flex-1 sm:flex-none text-xs sm:text-sm" size="sm">
            <History className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> History
          </Button>
          <Button onClick={onHostClick}
            className="bg-primary hover:bg-primary/90 flex-1 sm:flex-none text-xs sm:text-sm" size="sm">
            <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" /> Create
          </Button>
        </div>
      </div>

      {/* Featured banner */}
      <div
        className="relative rounded-xl overflow-hidden mb-6 sm:mb-8 p-4 sm:p-6"
        style={{
          backgroundImage: `linear-gradient(to right, hsl(var(--background)) 40%, transparent 100%), url(${tournamentBg})`,
          backgroundSize: "cover",
          backgroundPosition: "right center",
        }}
      >
        <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
            <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl bg-yellow-500/20 flex items-center justify-center text-2xl sm:text-4xl flex-shrink-0">
              🏆
            </div>
            <div className="flex flex-col">
              <div className="flex flex-wrap gap-2 mb-2 sm:mb-3">
                <span className="px-2 py-1 text-[10px] sm:text-xs font-medium bg-muted border border-border rounded">FEATURED EVENT</span>
                {featuredTournament.liveIn && (
                  <span className="px-2 py-1 text-[10px] sm:text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded">
                    LIVE IN {featuredTournament.liveIn}
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-2xl font-bold text-foreground mb-1 sm:mb-2">{featuredTournament.name}</h2>
              <p className="text-xs sm:text-base text-muted-foreground max-w-lg mb-3 sm:mb-4">{featuredTournament.description}</p>
              <div className="flex flex-wrap gap-4 sm:gap-8">
                <div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">PRIZE POOL</p>
                  <p className="text-sm sm:text-lg font-bold text-yellow-400 flex items-center gap-1">
                    <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
                    {featuredTournament.prizePool.toLocaleString()} CP
                  </p>
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">ENTRY FEE</p>
                  <p className="text-sm sm:text-lg font-bold text-foreground">{featuredTournament.entry} CP</p>
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">FORMAT</p>
                  <p className="text-sm sm:text-lg font-bold text-foreground">{featuredTournament.format}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-row lg:flex-col items-center lg:items-end gap-2 w-full lg:w-auto">
            <Button
              onClick={() => onSelectTournament(featuredTournament.id)}
              className="bg-accent hover:bg-accent/90 text-accent-foreground px-4 sm:px-8 text-sm flex-1 lg:flex-none"
            >
              Join Now →
            </Button>
            <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
              {featuredTournament.quota.current}/{featuredTournament.quota.max} Registered
            </span>
          </div>
        </div>
      </div>

      {/* Format filters */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex gap-1 sm:gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {FILTERS.map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              variant={activeFilter === id ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter(id)}
              className={`whitespace-nowrap text-xs sm:text-sm flex-shrink-0 ${
                activeFilter === id ? "bg-accent text-accent-foreground" : "bg-card border-border hover:bg-muted"
              }`}
            >
              {Icon && <Icon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />}
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{id === "all" ? "All" : label.split(" ")[0]}</span>
            </Button>
          ))}
        </div>
        <button
          onClick={() => refetch()}
          disabled={isLoading}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* API error banner */}
      {isError && (
        <div className="mb-4 px-3 py-2 bg-warning/10 border border-warning/20 rounded-lg text-[10px] sm:text-xs text-warning">
          API unavailable — showing sample data
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 bg-card border border-border rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Tournament grid */}
      {!isLoading && apiTournaments.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {apiTournaments.map((t) => (
            <TournamentCard key={t.id} tournament={t} onSelect={onSelectTournament} />
          ))}
        </div>
      )}

      {/* Mock fallback */}
      {showMock && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-[10px] sm:text-xs uppercase tracking-wider">
                  <th className="text-left p-2 sm:p-4">Tournament</th>
                  <th className="text-left p-2 sm:p-4">Format</th>
                  <th className="text-left p-2 sm:p-4">Entry</th>
                  <th className="text-left p-2 sm:p-4">Prize Pool</th>
                  <th className="text-left p-2 sm:p-4">Quota</th>
                  <th className="text-left p-2 sm:p-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {mockTournaments.map((t) => (
                  <tr key={t.id} className="border-b border-border last:border-b-0 hover:bg-muted/50">
                    <td className="p-2 sm:p-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/20 flex items-center justify-center text-base sm:text-xl flex-shrink-0">
                          {t.icon}
                        </div>
                        <span className="font-medium text-foreground text-xs sm:text-base">{t.name}</span>
                      </div>
                    </td>
                    <td className="p-2 sm:p-4">
                      <span className="text-[10px] sm:text-xs px-1.5 py-0.5 rounded bg-muted border border-border text-foreground">
                        {t.format}
                      </span>
                    </td>
                    <td className="p-2 sm:p-4 text-foreground text-xs sm:text-base whitespace-nowrap">{t.entry} CP</td>
                    <td className="p-2 sm:p-4">
                      <span className="text-yellow-400 flex items-center gap-1 text-xs sm:text-base whitespace-nowrap">
                        <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
                        {t.prizePool.toLocaleString()} CP
                      </span>
                    </td>
                    <td className="p-2 sm:p-4 text-foreground text-xs sm:text-base whitespace-nowrap">
                      {t.quota.current}/{t.quota.max}
                    </td>
                    <td className="p-2 sm:p-4">
                      <Button
                        size="sm"
                        disabled={t.quota.current >= t.quota.max}
                        onClick={() => onSelectTournament(t.id)}
                        className="bg-accent hover:bg-accent/90 text-accent-foreground text-xs disabled:opacity-50"
                      >
                        {t.quota.current >= t.quota.max ? "Full" : "Register"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentArena;
