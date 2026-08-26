import { Swords, Share2, MessageCircle } from "lucide-react";

interface ResultsActionsProps {
  onShareResults: () => void;
  onReturnToLobby: () => void;
  returnLabel?: string;
  /** Omit to render exactly as before (no Message button) — a completed match unconditionally satisfies chat's contact rule, so no gating check is needed here. */
  onMessageOpponent?: () => void;
}

const ResultsActions = ({ onShareResults, onReturnToLobby, returnLabel = "Return to Lobby", onMessageOpponent }: ResultsActionsProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
      <button
        onClick={onShareResults}
        className="flex-1 flex items-center justify-center gap-2 sm:gap-3 bg-secondary border border-border rounded-xl py-3 sm:py-4 hover:bg-muted transition-colors"
      >
        <span className="text-xs sm:text-sm font-medium">Share Results</span>
        <Share2 className="w-4 h-4 ml-1" />
      </button>

      {onMessageOpponent && (
        <button
          onClick={onMessageOpponent}
          className="flex-1 flex items-center justify-center gap-2 sm:gap-3 bg-secondary border border-border rounded-xl py-3 sm:py-4 hover:bg-muted transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          <span className="text-xs sm:text-sm font-medium">Message Opponent</span>
        </button>
      )}

      <button
        onClick={onReturnToLobby}
        className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl py-3 sm:py-4 hover:bg-primary/90 transition-colors"
      >
        <Swords className="w-4 h-4" />
        <span className="text-xs sm:text-sm font-medium">{returnLabel}</span>
      </button>
    </div>
  );
};

export default ResultsActions;
