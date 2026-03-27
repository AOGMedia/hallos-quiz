import { useState } from "react";
import { Swords, Clock, Loader2 } from "lucide-react";
import WagerBadge from "@/components/challenge/WagerBadge";
import type { Challenge } from "@/lib/api/lobby";

interface ChallengeCardProps {
  challenge: Challenge;
  onAccept: (id: string) => void;
  isAccepting?: boolean;
}

function timeLeft(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  if (hrs > 0) return `${hrs}h ${mins % 60}m left`;
  return `${mins}m left`;
}

const ChallengeCard = ({ challenge, onAccept, isAccepting }: ChallengeCardProps) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="card-player flex flex-col gap-3">
      {/* Creator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full border border-border bg-secondary flex-shrink-0 overflow-hidden flex items-center justify-center">
            {!imgError && challenge.challengerAvatar ? (
              <img
                src={challenge.challengerAvatar}
                alt={challenge.challengerNickname}
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <span className="text-sm font-bold text-primary">
                {challenge.challengerNickname.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{challenge.challengerNickname}</p>
            <p className="text-[10px] text-muted-foreground">
              {challenge.categoryName} · {challenge.challengerWins}W/{challenge.challengerLosses}L
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Clock className="w-3 h-3" />
          {timeLeft(challenge.expiresAt)}
        </div>
      </div>

      {/* Wager */}
      <WagerBadge amount={challenge.wagerAmount} label="Wager" size="sm" />

      {/* Accept */}
      <button
        onClick={() => onAccept(challenge.id)}
        disabled={isAccepting}
        className="btn-accent w-full flex items-center justify-center gap-2 text-sm disabled:opacity-50"
      >
        {isAccepting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Swords className="w-4 h-4" />}
        {isAccepting ? "Accepting..." : "Accept Challenge"}
      </button>
    </div>
  );
};

export default ChallengeCard;
