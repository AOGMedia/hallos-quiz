import { Trophy } from "lucide-react";

interface ResultsHeaderProps {
  isVictory: boolean;
}

const ResultsHeader = ({ isVictory }: ResultsHeaderProps) => {
  return (
    <div className="flex items-center justify-center gap-3 mb-8">
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          isVictory ? "bg-accent/20" : "bg-destructive/20"
        }`}
      >
        <Trophy className={`w-5 h-5 ${isVictory ? "text-accent" : "text-destructive"}`} />
      </div>
      <h1
        className={`text-4xl font-bold ${
          isVictory ? "text-accent" : "text-destructive"
        }`}
      >
        {isVictory ? "VICTORY!" : "DEFEAT"}
      </h1>
    </div>
  );
};

export default ResultsHeader;
