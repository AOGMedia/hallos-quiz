import { useEffect, useState } from "react";

interface QuestionCardProps {
  questionNumber: number;
  question: string;
  isBonus?: boolean;
  currentPlayer: {
    name: string;
    avatar: string;
  };
  opponentPlayer?: {
    name: string;
    avatar: string;
  };
  timeLeft: number;
  isOpponentTurn?: boolean;
}

const QuestionCard = ({
  questionNumber,
  question,
  isBonus = false,
  currentPlayer,
  opponentPlayer,
  timeLeft,
  isOpponentTurn = false,
}: QuestionCardProps) => {
  const displayPlayer = isOpponentTurn && opponentPlayer ? opponentPlayer : currentPlayer;
  const timerColor = timeLeft <= 5 ? "text-destructive" : "text-accent";

  return (
    <div className="mb-6">
      <div className="text-xs text-muted-foreground mb-2">Q{questionNumber}</div>
      <div className="bg-card border border-border rounded-xl p-4">
        {/* Top row: player info, timer, bonus badge */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <img
              src={displayPlayer.avatar}
              alt={displayPlayer.name}
              className="w-6 h-6 rounded-full"
            />
            <span className="text-xs text-muted-foreground">{displayPlayer.name}</span>
            <span className={`text-sm font-bold ${timerColor} bg-secondary px-2 py-0.5 rounded`}>
              {timeLeft}s
            </span>
          </div>
          {isBonus && (
            <span className="text-xs text-pink-500 font-medium">*BONUS QUESTION</span>
          )}
          {isOpponentTurn && opponentPlayer && (
            <div className="flex items-center gap-2">
              <img
                src={opponentPlayer.avatar}
                alt={opponentPlayer.name}
                className="w-6 h-6 rounded-full"
              />
              <span className="text-xs text-muted-foreground">{opponentPlayer.name}</span>
            </div>
          )}
        </div>

        {/* Question text */}
        <p className="text-sm text-foreground">{question}</p>
      </div>
    </div>
  );
};

export default QuestionCard;
