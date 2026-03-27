import { Zap, Swords } from "lucide-react";
import RankBadge from "./RankBadge";
import type { LobbyRankingEntry } from "@/lib/api/leaderboard";

interface LobbyTabProps {
  rankings: LobbyRankingEntry[];
}

const LobbyTab = ({ rankings }: LobbyTabProps) => (
  <div className="bg-card border border-border rounded-xl overflow-hidden">
    {/* Header */}
    <div className="grid grid-cols-[40px_1fr_90px_80px] gap-2 px-3 sm:px-4 py-2.5 border-b border-border text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">
      <span>#</span>
      <span>Player</span>
      <span className="text-right">Winnings</span>
      <span className="text-right">Win %</span>
    </div>

    {rankings.map((entry, i) => (
      <div
        key={entry.userId}
        className={`grid grid-cols-[40px_1fr_90px_80px] gap-2 items-center px-3 sm:px-4 py-3 transition-colors hover:bg-muted/50 ${
          i < rankings.length - 1 ? "border-b border-border" : ""
        } ${entry.rank <= 3 ? "bg-primary/5" : ""}`}
      >
        <div className="flex items-center justify-center">
          <RankBadge rank={entry.rank} />
        </div>

        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-accent/20 flex items-center justify-center text-xs font-bold text-accent flex-shrink-0">
            {(entry.nickname ?? entry.username ?? "?").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-medium text-foreground truncate">{entry.nickname ?? entry.username}</p>
            <p className="text-[10px] text-muted-foreground">{entry.lobbyMatches} matches</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-1">
          <Zap className="w-3 h-3 text-warning flex-shrink-0" />
          <span className="text-xs sm:text-sm font-semibold text-foreground">
            {entry.lobbyWinnings.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center justify-end gap-1">
          <Swords className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{(entry.lobbyWinRate ?? 0).toFixed(1)}%</span>
        </div>
      </div>
    ))}
  </div>
);

export default LobbyTab;
