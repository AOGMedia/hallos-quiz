import { useState } from "react";
import { History, Plus, Zap, Swords, Timer, Crown, GraduationCap, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import TournamentCard from "./TournamentCard";
import { useTournaments } from "@/hooks/useTournament";
import { FORMAT_LABELS, type Tournament, type TournamentFormat, type TournamentStatus } from "@/lib/api/tournament";
import FormatBadge from "./FormatBadge";
import tournamentBg from "@/assets/tournament-bg.png";

type FilterFormat = "all" | TournamentFormat;
type FilterStatus = Extract<TournamentStatus, "open" | "in_progress" | "completed">;

const STATUS_FILTERS: { id: FilterStatus; label: string }[] = [
  { id: "open",        label: "Open" },
  { id: "in_progress", label: "Live" },
  { id: "completed",   label: "Past" },
];

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

/** Countdown label for the featured banner, e.g. "2H 14MIN" */
function timeUntil(iso: string): string | null {
  const ms = new Date(iso).getTime() - Date.now();
  if (!Number.isFinite(ms) || ms <= 0) return null;
  const totalMinutes = Math.floor(ms / 60_000);
  const days = Math.floor(totalMinutes / 1440);
  if (days >= 1) return `${days}D ${Math.floor((totalMinutes % 1440) / 60)}H`;
  return `${Math.floor(totalMinutes / 60)}H ${totalMinutes % 60}MIN`;
}

/**
 * The banner headlines whichever real tournament is most worth joining — the
 * open one with the biggest prize pool, else whatever is live. There is no
 * hardcoded featured event any more: when the server has nothing to show, the
 * banner doesn't render.
 */
function pickFeatured(tournaments: Tournament[]): Tournament | null {
  if (tournaments.length === 0) return null;
  const byPrize = (a: Tournament, b: Tournament) => b.prizePool - a.prizePool;
  const open = tournaments.filter((t) => t.status === "open").sort(byPrize);
  if (open.length > 0) return open[0];
  return tournaments.filter((t) => t.status === "in_progress").sort(byPrize)[0] ?? null;
}

const TournamentArena = ({ onHistoryClick, onHostClick, onSelectTournament }: TournamentArenaProps) => {
  const [activeFilter, setActiveFilter] = useState<FilterFormat>("all");
  const [activeStatus, setActiveStatus] = useState<FilterStatus>("open");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error, refetch, isFetching } = useTournaments({
    ...(activeFilter !== "all" ? { format: activeFilter } : {}),
    status: activeStatus,
    page,
  });

  const apiTournaments = data?.tournaments ?? [];
  const totalPages = data?.totalPages ?? 1;
  const featured = pickFeatured(apiTournaments);
  const featuredLiveIn = featured ? timeUntil(featured.startTime) : null;

  /** Any filter change invalidates the current page number */
  const changeFilter = (apply: () => void) => { apply(); setPage(1); };

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-primary mb-1 sm:mb-2">Tournament Arena</h1>
          <p className="text-xs sm:text-base text-muted-foreground">
            Compete for Morgan Points (MP) and exchange your winnings for real rewards
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

      {/* Featured banner — always rendered. Filled with the highest-value real
          tournament when there is one; otherwise the same banner carries an
          honest "nothing scheduled" message rather than invented numbers. */}
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
                <span className="px-2 py-1 text-[10px] sm:text-xs font-medium bg-muted border border-border rounded">
                  FEATURED EVENT
                </span>
                {featured?.status === "in_progress" ? (
                  <span className="px-2 py-1 text-[10px] sm:text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded">
                    LIVE NOW
                  </span>
                ) : featuredLiveIn ? (
                  <span className="px-2 py-1 text-[10px] sm:text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded">
                    LIVE IN {featuredLiveIn}
                  </span>
                ) : !featured && !isLoading ? (
                  <span className="px-2 py-1 text-[10px] sm:text-xs font-medium bg-muted text-muted-foreground border border-border rounded">
                    NONE SCHEDULED
                  </span>
                ) : null}
              </div>
              <h2 className="text-lg sm:text-2xl font-bold text-foreground mb-1 sm:mb-2">
                {featured ? featured.name : isLoading ? "Loading tournaments…" : "No tournaments scheduled yet"}
              </h2>
              <p className="text-xs sm:text-base text-muted-foreground max-w-lg mb-3 sm:mb-4">
                {featured
                  ? featured.description
                  : "New events are posted regularly — or propose your own and an admin will review it."}
              </p>
              <div className="flex flex-wrap gap-4 sm:gap-8">
                <div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">PRIZE POOL</p>
                  <p className="text-sm sm:text-lg font-bold text-yellow-400 flex items-center gap-1">
                    <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
                    {featured ? `${featured.prizePool.toLocaleString()} MP` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">ENTRY FEE</p>
                  <p className="text-sm sm:text-lg font-bold text-foreground">
                    {featured ? `${featured.entryFee} MP` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">FORMAT</p>
                  <p className="text-sm sm:text-lg font-bold text-foreground">
                    {featured ? <FormatBadge format={featured.format} /> : "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-row lg:flex-col items-center lg:items-end gap-2 w-full lg:w-auto">
            <Button
              onClick={() => (featured ? onSelectTournament(featured.id) : onHostClick())}
              className="bg-accent hover:bg-accent/90 text-accent-foreground px-4 sm:px-8 text-sm flex-1 lg:flex-none"
            >
              {featured
                ? featured.status === "in_progress" ? "View →" : "Join Now →"
                : "Create One →"}
            </Button>
            <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
              {featured
                ? `${featured.currentParticipants}${featured.maxParticipants ? `/${featured.maxParticipants}` : ""} Registered`
                : "0 Registered"}
            </span>
          </div>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex gap-1 sm:gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
        {STATUS_FILTERS.map(({ id, label }) => (
          <Button
            key={id}
            variant={activeStatus === id ? "default" : "outline"}
            size="sm"
            onClick={() => changeFilter(() => setActiveStatus(id))}
            className={`whitespace-nowrap text-xs sm:text-sm flex-shrink-0 ${
              activeStatus === id
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-card border-border hover:bg-muted"
            }`}
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Format filters */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex gap-1 sm:gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {FILTERS.map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              variant={activeFilter === id ? "default" : "outline"}
              size="sm"
              onClick={() => changeFilter(() => setActiveFilter(id))}
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
          disabled={isFetching}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* API error banner */}
      {isError && (
        <div className="mb-4 px-3 py-2 bg-warning/10 border border-warning/20 rounded-lg text-[10px] sm:text-xs text-warning">
          {(error as Error)?.message ?? "Couldn't load tournaments."}{" "}
          <button onClick={() => refetch()} className="underline font-medium">Try again</button>
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

      {/* Empty */}
      {!isLoading && !isError && apiTournaments.length === 0 && (
        <p className="text-xs sm:text-sm text-muted-foreground py-8 text-center">
          No {activeStatus === "in_progress" ? "live" : activeStatus === "completed" ? "past" : "open"} tournaments
          {activeFilter !== "all" ? ` in ${FORMAT_LABELS[activeFilter]}` : ""} — check back soon, or create your own.
        </p>
      )}

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || isFetching}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="bg-card border-border hover:bg-muted text-xs"
          >
            Previous
          </Button>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages || isFetching}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="bg-card border-border hover:bg-muted text-xs"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default TournamentArena;
