import { ChevronLeft, Zap, Clock, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import RankBadge from "@/components/leaderboard/RankBadge";
import { useTournamentLeaderboard } from "@/hooks/useTournament";

interface TournamentLeaderboardViewProps {
  tournamentId: string;
  tournamentName?: string;
  onBack: () => void;
}

const TournamentLeaderboardView = ({
  tournamentId,
  tournamentName,
  onBack,
}: TournamentLeaderboardViewProps) => {
  const { data, isLoading } = useTournamentLeaderboard(tournamentId);

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5 sm:mb-6">
        <Button variant="outline" size="icon" onClick={onBack}
          className="bg-card border-border hover:bg-muted rounded-full w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
        <div>
          <h1 className="text-base sm:text-xl font-bold text-foreground">Live Standings</h1>
          {tournamentName && (
            <p className="text-xs text-muted-foreground truncate">{tournamentName}</p>
          )}
        </div>
        {data && (
          <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 bg-primary/20 border border-primary/30 rounded-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] sm:text-xs text-primary font-medium">
              Round {data.currentRound}/{data.totalRounds}
            </span>
          </div>
        )}
      </div>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 bg-card border border-border rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {data && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {/* Column headers */}
          <div className="grid grid-cols-[40px_1fr_70px_70px_60px] gap-2 px-3 sm:px-4 py-2.5 border-b border-border text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">
            <span>#</span>
            <span>Player</span>
            <span className="text-right">Score</span>
            <span className="text-right hidden sm:block">Avg Time</span>
            <span className="text-right">Status</span>
          </div>

          {data.participants.map((p, i) => (
            <div
              key={p.userId}
              className={`grid grid-cols-[40px_1fr_70px_70px_60px] gap-2 items-center px-3 sm:px-4 py-3 transition-colors hover:bg-muted/50 ${
                i < data.participants.length - 1 ? "border-b border-border" : ""
              } ${p.placement <= 3 ? "bg-primary/5" : ""}`}
            >
              <div className="flex items-center justify-center">
                <RankBadge rank={p.placement} />
              </div>

              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                  {p.username.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-foreground truncate">{p.username}</p>
                  <p className="text-[10px] text-muted-foreground">Round {p.currentRound}</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-1">
                <Target className="w-3 h-3 text-accent" />
                <span className="text-xs sm:text-sm font-semibold text-foreground">{p.totalScore}</span>
              </div>

              <div className="hidden sm:flex items-center justify-end gap-1">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {(p.averageTime / 1000).toFixed(1)}s
                </span>
              </div>

              <div className="flex justify-end">
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                  p.status === "active"
                    ? "bg-green-500/20 text-green-400"
                    : "bg-red-500/20 text-red-400"
                }`}>
                  {p.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TournamentLeaderboardView;
