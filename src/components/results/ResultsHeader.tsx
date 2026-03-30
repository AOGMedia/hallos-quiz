import { Trophy } from "lucide-react";

interface ResultsHeaderProps {
  isVictory: boolean | null;
}

const ResultsHeader = ({ isVictory }: ResultsHeaderProps) => {
  return (
    <div className="flex items-center justify-center gap-3 mb-8">
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          isVictory === null ? "bg-muted/20" : isVictory ? "bg-accent/20" : "bg-destructive/20"
        }`}
      >
        <Trophy className={`w-5 h-5 ${isVictory === null ? "text-muted-foreground" : isVictory ? "text-accent" : "text-destructive"}`} />
      </div>
      <div className="flex flex-col items-center">
        <h1
          className={`text-2xl sm:text-4xl font-bold ${
            isVictory === null ? "text-muted-foreground" : isVictory ? "text-accent" : "text-destructive"
          }`}
        >
          {isVictory === null ? "CALCULATING..." : isVictory ? "VICTORY!" : "DEFEAT"}
        </h1>
        {isVictory === null && (
          <span className="text-xs sm:text-sm animate-pulse text-muted-foreground mt-2">Waiting for opponent to finish...</span>
        )}
      </div>
    </div>
  );
};

export default ResultsHeader;
