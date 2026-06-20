import { CheckCircle, Mail } from "lucide-react";

interface CampaignResultsScreenProps {
  result: {
    totalCorrect: number;
    totalQuestions: number;
    totalTimeMs: number;
  };
}

const formatDuration = (ms: number) => {
  const secs = Math.floor(ms / 1000);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}min ${s.toString().padStart(2, "0")}sec`;
};

const CampaignResultsScreen = ({ result }: CampaignResultsScreenProps) => {
  const { totalCorrect, totalQuestions, totalTimeMs } = result;
  const pct = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-40 bg-gradient-radial from-primary/30 to-transparent blur-3xl pointer-events-none" />

      <div className="max-w-sm w-full space-y-6 relative">
        <div className="text-center">
          <CheckCircle className="w-12 h-12 text-success mx-auto mb-3" />
          <h1 className="text-xl font-bold text-foreground">Quiz Complete!</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Your results have been sent to your email.
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div className="text-center">
            <p className="text-5xl font-bold text-primary">{totalCorrect}</p>
            <p className="text-sm text-muted-foreground mt-1">
              out of {totalQuestions} correct
            </p>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className="bg-primary rounded-full h-2 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{pct}% accuracy</span>
            {totalTimeMs > 0 && <span>{formatDuration(totalTimeMs)}</span>}
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Mail className="w-3.5 h-3.5 shrink-0" />
          <span>Results sent to your email</span>
        </div>

        <a
          href="https://www.hallos.net/dashboard/games"
          className="block text-center text-sm text-primary underline"
        >
          Return to Hallos
        </a>
      </div>
    </div>
  );
};

export default CampaignResultsScreen;
