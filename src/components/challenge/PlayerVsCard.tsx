import { Swords } from "lucide-react";

interface Player {
  name: string;
  avatar: string;
}

interface PlayerVsCardProps {
  player1: Player;
  player2: Player;
  label?: string;
}

const PlayerVsCard = ({ player1, player2, label }: PlayerVsCardProps) => (
  <div className="bg-secondary rounded-xl p-4 sm:p-6">
    {label && (
      <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider text-center mb-3">
        {label}
      </p>
    )}
    <div className="flex items-center justify-center gap-3 sm:gap-8 flex-wrap">
      <div className="flex flex-col items-center gap-1.5">
        <img src={player1.avatar} alt={player1.name} className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-primary" />
        <span className="text-xs sm:text-sm font-semibold text-foreground truncate max-w-[80px] sm:max-w-[100px]">{player1.name}</span>
      </div>
      <div className="flex flex-col items-center gap-1">
        <Swords className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
        <span className="text-lg sm:text-2xl font-bold text-primary">VS</span>
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <img src={player2.avatar} alt={player2.name} className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-pink-500" />
        <span className="text-xs sm:text-sm font-semibold text-foreground truncate max-w-[80px] sm:max-w-[100px]">{player2.name}</span>
      </div>
    </div>
  </div>
);

export default PlayerVsCard;
