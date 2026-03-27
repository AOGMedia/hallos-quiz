import { Zap, Trophy } from "lucide-react";
import RankBadge from "./RankBadge";
import type { TournamentRankingEntry } from "@/lib/api/leaderboard";

interface TournamentTabProps {
  rankings: TournamentRankingEntry[];
}

const TournamentTab = ({ rankings }: TournamentTabProps) => (
  <div className="bg-card border border-border rounded-xl overflow-hidden">
    {/* Header */}
    <div className="grid grid-cols-[40px_1fr_90px_70px_70px] gap-2 px-3 sm:px-4 py-2.5 border-b border-border text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">
      <span>#</span>
      <span>Player</span>
      <span className="text-right">Prize CP</span>
      <span className="text-right hidden sm:block">Won</span>
      <span className="text-right hidden sm:block">Top 3</span>
    </div>

    {rankings.map((entry, i) => (
      <div
        key={entry.userId}
        className={`grid grid-cols-[40px_1fr_90px_70px_70px] gap-2 items-center px-3 sm:px-4 py-3 transition-colors hover:bg-muted/50 ${
          i < rankings.length - 1 ? "border-b border-border" : ""
        } ${entry.rank <= 3 ? "bg-primary/5" : ""}`}
      >
        <div className="flex items-center justify-center">
          <RankBadge rank={entry.rank} />
        </div>

        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-yellow-500/20 flex items-center justify-center text-xs font-bold text-yellow-400 flex-shrink-0">
            {(entry.nickname ?? entry.username ?? "?").charAt(0).toUpperCase()}
          </div>
          <span className="text-xs sm:text-sm font-medium text-foreground truncate">{entry.nickname ?? entry.username}</span>
        </div>

        <div className="flex items-center justify-end gap-1">
          <Zap className="w-3 h-3 text-warning flex-shrink-0" />
          <span className="text-xs sm:text-sm font-semibold text-foreground">
            {entry.tournamentWinnings.toLocaleString()}
          </span>
        </div>

        <div className="hidden sm:flex items-center justify-end gap-1">
          <Trophy className="w-3 h-3 text-yellow-400" />
          <span className="text-xs text-muted-foreground">{entry.tournamentsWon}</span>
        </div>

        <div className="hidden sm:flex items-center justify-end">
          <span className="text-xs text-muted-foreground">{entry.top3Finishes}</span>
        </div>
      </div>
    ))}
  </div>
);

export default TournamentTab;
