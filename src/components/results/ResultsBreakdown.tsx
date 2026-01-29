import { Check, X, Clock } from "lucide-react";
import type { GameResult } from "@/data/quizData";

interface ResultsBreakdownProps {
  results: GameResult[];
}

const ResultsBreakdown = ({ results }: ResultsBreakdownProps) => {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden mb-6 animate-fade-in w-full">
      <div className="overflow-x-auto scrollbar-hide">
        <div className="min-w-[400px]">
          {results.map((result, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 sm:p-3 md:p-4 border-b border-border last:border-b-0 gap-2"
            >
              <div className="flex items-center gap-1 sm:gap-2 md:gap-4 flex-1 min-w-0">
                <span className="text-[10px] sm:text-xs text-muted-foreground flex-shrink-0">Q{result.questionNumber}:</span>
                <span className="text-[10px] sm:text-xs md:text-sm text-muted-foreground truncate max-w-[100px] sm:max-w-[150px] md:max-w-none">
                  {result.question}
                </span>
              </div>

              <div className="flex items-center gap-1 sm:gap-2 md:gap-4 flex-shrink-0">
                {result.isCorrect ? (
                  <Check className="w-3 h-3 sm:w-4 sm:h-4 text-success" />
                ) : (
                  <X className="w-3 h-3 sm:w-4 sm:h-4 text-destructive" />
                )}
                <span className="text-[10px] sm:text-xs md:text-sm whitespace-nowrap">
                  <span className="text-accent hidden sm:inline">Ans: </span>
                  <span className={result.isCorrect ? "text-success" : "text-destructive"}>
                    {result.answer}
                  </span>
                </span>
                <div className="flex items-center gap-0.5 sm:gap-1 text-muted-foreground">
                  <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  <span className="text-[10px] sm:text-xs">{result.timeInSeconds}s</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResultsBreakdown;
