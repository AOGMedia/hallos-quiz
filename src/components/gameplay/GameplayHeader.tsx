import { Swords } from "lucide-react";

interface GameplayHeaderProps {
  player1: {
    name: string;
    avatar: string;
    score: number;
  };
  player2: {
    name: string;
    avatar: string;
    score: number;
  };
}

const GameplayHeader = ({ player1, player2 }: GameplayHeaderProps) => {
  return (
    <header className="flex flex-col items-center pt-4 sm:pt-6 pb-4">
      {/* Title */}
      <div className="flex items-center gap-2 text-primary mb-4 sm:mb-6">
        <Swords className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="text-xs sm:text-sm font-medium">Friendly Challenge</span>
      </div>

      {/* Score display */}
      <div className="flex flex-col items-center">
        <span className="text-[10px] sm:text-xs text-muted-foreground mb-2">Zeta points won</span>
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2">
            <img
              src={player1.avatar}
              alt={player1.name}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-primary"
            />
            <span className="text-xl sm:text-2xl font-bold text-foreground">{player1.score}</span>
          </div>

          <span className="text-lg sm:text-xl text-accent font-bold">⚡</span>

          <div className="flex items-center gap-2">
            <span className="text-xl sm:text-2xl font-bold text-foreground">{player2.score}</span>
            <img
              src={player2.avatar}
              alt={player2.name}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-pink-500"
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default GameplayHeader;
