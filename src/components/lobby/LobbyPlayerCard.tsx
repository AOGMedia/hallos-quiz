import { Zap, BarChart2, Swords } from "lucide-react";

interface LobbyPlayerCardProps {
  name: string;
  avatar: string;
  points: number;
  wins: number;
  losses: number;
  isAI?: boolean;
  onChallenge: () => void;
}

const LobbyPlayerCard = ({
  name,
  avatar,
  points,
  wins,
  losses,
  isAI = false,
  onChallenge,
}: LobbyPlayerCardProps) => {
  return (
    <div className="card-player">
      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <img
            src={avatar}
            alt={name}
            className="w-12 h-12 rounded-full object-cover border-2 border-border"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground">{name}</span>
          {isAI && (
            <span className="bg-accent text-accent-foreground text-[10px] font-bold px-1.5 py-0.5 rounded">
              AI
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2 mb-4">
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

export default LobbyPlayerCard;
