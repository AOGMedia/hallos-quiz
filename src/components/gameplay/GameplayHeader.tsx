import { Swords } from "lucide-react";

interface GameplayHeaderProps {
  player1: { name: string; avatar: string; score: number };
  player2: { name: string; avatar: string; score: number };
  questionNumber: number;
  totalQuestions: number;
}

const GameplayHeader = ({ player1, player2, questionNumber, totalQuestions }: GameplayHeaderProps) => {
  const p1Width = totalQuestions > 0 ? Math.round((questionNumber - 1) / totalQuestions * 100) : 0;

  return (
    <header className="pt-4 sm:pt-5 pb-3 px-4 sm:px-6 max-w-2xl mx-auto w-full">
      {/* Title */}
      <div className="flex items-center justify-center gap-2 text-primary mb-3">
        <Swords className="w-4 h-4" />
        <span className="text-xs font-medium">Live Challenge</span>
      </div>

      {/* Players + scores */}
      <div className="flex items-center gap-3">
        {/* Me */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <img src={player1.avatar} alt={player1.name}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 border-primary shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground truncate">You</p>
            <p className="text-sm font-semibold text-foreground truncate">{player1.name}</p>
          </div>
          <span className="text-xl sm:text-2xl font-bold text-primary ml-auto shrink-0">{player1.score}</span>
        </div>

        {/* VS divider */}
        <div className="flex flex-col items-center shrink-0 px-1">
          <span className="text-sm font-bold text-accent">⚡</span>
          <span className="text-[9px] text-muted-foreground font-medium">VS</span>
        </div>

        {/* Opponent */}
        <div className="flex items-center gap-2 flex-1 min-w-0 flex-row-reverse">
          <img src={player2.avatar} alt={player2.name}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 border-pink-500 shrink-0" />
          <div className="min-w-0 text-right">
            <p className="text-[10px] text-muted-foreground truncate">Opponent</p>
            <p className="text-sm font-semibold text-foreground truncate">{player2.name}</p>
          </div>
          <span className="text-xl sm:text-2xl font-bold text-pink-400 mr-auto shrink-0">{player2.score}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${p1Width}%` }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-muted-foreground">Q{questionNumber} of {totalQuestions}</span>
        <span className="text-[10px] text-muted-foreground">{p1Width}% done</span>
      </div>
    </header>
  );
};

export default GameplayHeader;
