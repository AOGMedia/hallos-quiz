import { Clock } from "lucide-react";
import AnswerOption from "@/components/gameplay/AnswerOption";
import type { CampaignQuestion } from "@/lib/api/campaignQuiz";

interface CampaignQuizQuestionProps {
  question: CampaignQuestion;
  options: { value: string; label: string }[];
  selectedAnswer: string | null;
  hasAnswered: boolean;
  qTimeLeft: number;
  onAnswerSelect: (value: string) => void;
}

const CampaignQuizQuestion = ({
  question,
  options,
  selectedAnswer,
  hasAnswered,
  qTimeLeft,
  onAnswerSelect,
}: CampaignQuizQuestionProps) => {
  const qUrgent = qTimeLeft <= 5;
  const qWarning = qTimeLeft <= 8 && qTimeLeft > 5;

  return (
    <div className="mb-5">
      <div className="flex justify-end mb-3">
        <div
          className={`flex items-center gap-1.5 font-bold px-3 py-1 rounded-lg text-sm transition-colors ${
            qUrgent
              ? "bg-destructive/20 text-destructive animate-pulse"
              : qWarning
              ? "bg-yellow-500/20 text-yellow-400"
              : "bg-secondary text-accent"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          {qTimeLeft}s
        </div>
      </div>

      <div
        className={`bg-card border border-border rounded-xl p-4 sm:p-5 transition-opacity ${
          hasAnswered ? "opacity-70" : ""
        }`}
      >
        <p className="text-sm sm:text-base text-foreground leading-relaxed">
          {question.questionText}
        </p>
      </div>

      {hasAnswered && (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          {selectedAnswer ? "Answer submitted — next question in a moment…" : "Time's up — moving on…"}
        </p>
      )}

      <div className="flex flex-col gap-3 mt-5">
        {options.map((opt) => (
          <AnswerOption
            key={opt.value}
            label={opt.label}
            value={opt.value}
            state={selectedAnswer === opt.value ? "selected" : "default"}
            onClick={() => onAnswerSelect(opt.value)}
            disabled={hasAnswered}
          />
        ))}
      </div>
    </div>
  );
};

export default CampaignQuizQuestion;
