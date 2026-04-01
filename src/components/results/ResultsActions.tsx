import { Swords, Share2 } from "lucide-react";

interface ResultsActionsProps {
  onShareResults: () => void;
  onReturnToLobby: () => void;
}

const ResultsActions = ({ onShareResults, onReturnToLobby }: ResultsActionsProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
      <button
        onClick={onShareResults}
        className="flex-1 flex items-center justify-center gap-2 sm:gap-3 bg-secondary border border-border rounded-xl py-3 sm:py-4 hover:bg-muted transition-colors"
      >
        <span className="text-xs sm:text-sm font-medium">Share Results</span>
        <Share2 className="w-4 h-4 ml-1" />
      </button>

      <button
        onClick={onReturnToLobby}
        className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl py-3 sm:py-4 hover:bg-primary/90 transition-colors"
      >
        <Swords className="w-4 h-4" />
        <span className="text-xs sm:text-sm font-medium">Return to Lobby</span>
      </button>
    </div>
  );
};

export default ResultsActions;
