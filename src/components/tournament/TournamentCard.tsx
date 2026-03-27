import { Zap, Users, Clock } from "lucide-react";
import FormatBadge from "./FormatBadge";
import type { Tournament } from "@/lib/api/tournament";

interface TournamentCardProps {
  tournament: Tournament;
  onSelect: (id: string) => void;
}

function timeUntil(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return "Started";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

const TournamentCard = ({ tournament, onSelect }: TournamentCardProps) => {
  const isFull = tournament.currentParticipants >= tournament.maxParticipants;
  const fillPct = Math.round((tournament.currentParticipants / tournament.maxParticipants) * 100);

  return (
    <div
      className="card-player flex flex-col gap-3 cursor-pointer hover:border-primary/50 transition-colors"
      onClick={() => onSelect(tournament.id)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm sm:text-base font-semibold text-foreground truncate">{tournament.name}</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{tournament.categoryName}</p>
        </div>
        <FormatBadge format={tournament.format} size="sm" />
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-3 text-[10px] sm:text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Zap className="w-3 h-3 text-warning" />
          {tournament.entryFee} CP
        </span>
        <span className="flex items-center gap-1">
          <Zap className="w-3 h-3 text-yellow-400" />
          {tournament.prizePool.toLocaleString()} pool
        </span>
        <span className="flex items-center gap-1 ml-auto">
          <Clock className="w-3 h-3" />
          {timeUntil(tournament.startTime)}
        </span>
      </div>

      {/* Quota bar */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Users className="w-3 h-3" />
            {tournament.currentParticipants}/{tournament.maxParticipants}
          </span>
          <span className="text-[10px] text-muted-foreground">{fillPct}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${isFull ? "bg-destructive" : "bg-primary"}`}
            style={{ width: `${fillPct}%` }}
          />
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={(e) => { e.stopPropagation(); onSelect(tournament.id); }}
        disabled={isFull}
        className={`w-full py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${
          isFull
            ? "bg-muted text-muted-foreground cursor-not-allowed"
            : "bg-accent hover:bg-accent/90 text-accent-foreground"
        }`}
      >
        {isFull ? "Full" : "View & Register"}
      </button>
    </div>
  );
};

export default TournamentCard;
