import { Clock } from "lucide-react";

interface CampaignQuizHeaderProps {
  currentIndex: number;
  totalQuestions: number;
  totalTimeLeft: number;
  hasAnswered: boolean;
}

const formatCountdown = (secs: number) => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const CampaignQuizHeader = ({
  currentIndex,
  totalQuestions,
  totalTimeLeft,
  hasAnswered,
}: CampaignQuizHeaderProps) => {
  const totalUrgent = totalTimeLeft <= 60;
  const progress = ((currentIndex + (hasAnswered ? 1 : 0)) / totalQuestions) * 100;

  return (
    <header className="flex items-center gap-3 px-4 py-3 max-w-2xl mx-auto w-full">
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        Q<span className="font-semibold text-foreground">{currentIndex + 1}</span>/{totalQuestions}
      </span>

      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div
        className={`flex items-center gap-1 text-xs font-mono font-semibold px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
          totalUrgent
            ? "bg-destructive/20 text-destructive animate-pulse"
            : "bg-secondary text-muted-foreground"
        }`}
      >
        <Clock className="w-3 h-3 shrink-0" />
        {formatCountdown(totalTimeLeft)}
      </div>
    </header>
  );
};

export default CampaignQuizHeader;
