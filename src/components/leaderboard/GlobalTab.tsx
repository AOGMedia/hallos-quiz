import { Zap, Target, BarChart2 } from "lucide-react";
import RankBadge from "./RankBadge";
import type { GlobalRankingEntry } from "@/lib/api/leaderboard";

interface GlobalTabProps {
  rankings: GlobalRankingEntry[];
  userRank: number;
  totalPlayers: number;
}

const GlobalTab = ({ rankings, userRank, totalPlayers }: GlobalTabProps) => (
  <div className="space-y-3">
    {/* User's own rank banner */}
    <div className="flex items-center justify-between p-3 sm:p-4 bg-primary/10 border border-primary/30 rounded-xl">
      <span className="text-xs sm:text-sm text-muted-foreground">Your global rank</span>
      <div className="flex items-center gap-2">
        <span className="text-sm sm:text-base font-bold text-primary">#{userRank}</span>
        <span className="text-[10px] sm:text-xs text-muted-foreground">of {totalPlayers.toLocaleString()}</span>
      </div>
    </div>

    {/* Table */}
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[40px_1fr_80px_70px_70px] gap-2 px-3 sm:px-4 py-2.5 border-b border-border text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">
        <span>#</span>
        <span>Player</span>
        <span className="text-right">Winnings</span>
        <span className="text-right hidden sm:block">Win </span>
        <span className="text-right hidden sm:block">Accuracy%</span>
      </div>

      {rankings.map((entry, i) => (
        <div
          key={entry.userId}
          className={`grid grid-cols-[40px_1fr_80px_70px_70px] gap-2 items-center px-3 sm:px-4 py-3 transition-colors hover:bg-muted/50 ${
            i < rankings.length - 1 ? "border-b border-border" : ""
          } ${entry.rank <= 3 ? "bg-primary/5" : ""}`}
        >
          <div className="flex items-center justify-center">
            <RankBadge rank={entry.rank} />
          </div>

          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
              {(entry.nickname ?? entry.username ?? "?").charAt(0).toUpperCase()}
            </div>
            <span className="text-xs sm:text-sm font-medium text-foreground truncate">{entry.nickname ?? entry.username}</span>
          </div>

          <div className="flex items-center justify-end gap-1">
            <Zap className="w-3 h-3 text-warning flex-shrink-0" />
            <span className="text-xs sm:text-sm font-semibold text-foreground">
              {entry.totalWinnings.toLocaleString()}
            </span>
          </div>
          <div className="hidden sm:flex items-center justify-end gap-1">
            <Target className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{entry.lobbyStats?.wins ?? 0} wins</span>
          </div>

          <div className="hidden sm:flex items-center justify-end gap-1">
            <BarChart2 className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{(entry.lobbyStats?.winRate ?? 0).toFixed(1)}%</span>
          </div>

        </div>
      ))}
    </div>
  </div>
);

export default GlobalTab;
