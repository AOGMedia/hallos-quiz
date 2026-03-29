import { Clock } from "lucide-react";

interface QuestionCardProps {
  questionNumber: number;
  totalQuestions: number;
  question: string;
  isBonus?: boolean;
  timeLeft: number;
  hasAnswered: boolean;
  opponentAnsweredCount: number; // how many questions opponent has answered so far
}

const QuestionCard = ({
  question,
  isBonus = false,
  timeLeft,
  hasAnswered,
  opponentAnsweredCount,
}: QuestionCardProps) => {
  const timerUrgent = timeLeft <= 5;
  const timerWarning = timeLeft <= 8 && timeLeft > 5;

  return (
    <div className="mb-5">
      {/* Timer + status row */}
      <div className="flex items-center justify-between mb-3">
        {/* Opponent live status */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
          <span>Opponent: Q{opponentAnsweredCount + 1}</span>
        </div>

        {/* Timer */}
        <div className={`flex items-center gap-1.5 font-bold px-3 py-1 rounded-lg text-sm transition-colors ${
          timerUrgent
            ? "bg-destructive/20 text-destructive animate-pulse"
            : timerWarning
            ? "bg-warning/20 text-warning"
            : "bg-secondary text-accent"
        }`}>
          <Clock className="w-3.5 h-3.5" />
          {timeLeft}s
        </div>
      </div>

      {/* Question card */}
      <div className={`bg-card border rounded-xl p-4 sm:p-5 transition-all ${
        isBonus ? "border-pink-500/60 shadow-[0_0_12px_rgba(236,72,153,0.15)]" : "border-border"
      } ${hasAnswered ? "opacity-80" : ""}`}>
        {isBonus && (
          <span className="text-[10px] text-pink-400 font-semibold uppercase tracking-widest mb-2 block">
            ★ Bonus Question
          </span>
        )}
        <p className="text-sm sm:text-base text-foreground leading-relaxed">{question}</p>
      </div>

      {/* Answered indicator */}
      {hasAnswered && (
        <div className="mt-2 text-center text-xs text-muted-foreground">
          Answer submitted — next question in a moment…
        </div>
      )}
    </div>
  );
};

export default QuestionCard;
