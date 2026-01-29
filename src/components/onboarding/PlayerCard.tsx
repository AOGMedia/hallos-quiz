import { Swords, Zap, BarChart2 } from "lucide-react";

interface PlayerCardProps {
  name: string;
  avatar: string;
  points: number;
  wins: number;
  losses: number;
  isAI?: boolean;
  onChallenge?: () => void;
}

const PlayerCard = ({
  name,
  avatar,
  points,
  wins,
  losses,
  isAI = false,
  onChallenge,
}: PlayerCardProps) => {
  return (
    <div className="card-player animate-fade-in">
      <div className="flex items-center gap-3 mb-3">
        <div className="relative">
          <img
            src={avatar}
            alt={name}
            className="w-10 h-10 rounded-full object-cover border-2 border-border"
          />
          {isAI && (
            <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-[10px] font-bold px-1.5 py-0.5 rounded">
              AI
            </span>
          )}
        </div>
        <span className="font-semibold text-foreground">{name}</span>
      </div>

      <div className="space-y-1.5 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <Zap className="w-4 h-4 text-warning" />
          <span className="text-muted-foreground">{points.toLocaleString()} Zeta Points</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <BarChart2 className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">
            {wins} Wins / {losses} Losses
          </span>
        </div>
      </div>

      <button onClick={onChallenge} className="btn-accent w-full flex items-center justify-center gap-2">
        <Swords className="w-4 h-4" />
        Challenge
      </button>
    </div>
  );
};

export default PlayerCard;
