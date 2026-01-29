interface ResultsScoreCardProps {
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
  playTime: string;
  showResults: boolean;
  onToggleResults: () => void;
}

const ResultsScoreCard = ({
  player1,
  player2,
  playTime,
  showResults,
  onToggleResults,
}: ResultsScoreCardProps) => {
  return (
    <div className="bg-card border border-border rounded-xl p-3 sm:p-6 mb-4 w-full">
      {/* Score display - responsive layout */}
      <div className="flex items-center justify-between mb-4 gap-2">
        <div className="flex items-center gap-1.5 sm:gap-3 flex-1 min-w-0">
          <img
            src={player1.avatar}
            alt={player1.name}
            className="w-7 h-7 sm:w-10 sm:h-10 rounded-full border-2 border-primary flex-shrink-0"
          />
          <span className="text-[10px] sm:text-sm text-muted-foreground truncate hidden xs:block">{player1.name}</span>
          <span className="text-lg sm:text-3xl font-bold text-foreground">{player1.score}</span>
        </div>

        <div className="flex flex-col items-center flex-shrink-0 px-2">
          <span className="text-[8px] sm:text-xs text-muted-foreground whitespace-nowrap">Zeta points won</span>
          <span className="text-base sm:text-xl text-accent font-bold">⚡</span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3 flex-1 min-w-0 justify-end">
          <span className="text-lg sm:text-3xl font-bold text-foreground">{player2.score}</span>
          <span className="text-[10px] sm:text-sm text-muted-foreground truncate hidden xs:block">{player2.name}</span>
          <img
            src={player2.avatar}
            alt={player2.name}
            className="w-7 h-7 sm:w-10 sm:h-10 rounded-full border-2 border-pink-500 flex-shrink-0"
          />
        </div>
      </div>

      {/* Play time and toggle */}
      <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-border gap-2 sm:gap-0">
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm text-muted-foreground">Play Time:</span>
          <span className="text-xs sm:text-sm text-accent font-medium">{playTime}</span>
        </div>
        <button
          onClick={onToggleResults}
          className="text-xs sm:text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          View results
          <span className={`transition-transform ${showResults ? "rotate-180" : ""}`}>
            ▼
          </span>
        </button>
      </div>
    </div>
  );
};

export default ResultsScoreCard;
