import { useState } from "react";
import { Swords, Clock, Loader2, X, BookOpen } from "lucide-react";
import WagerBadge from "@/components/challenge/WagerBadge";
import type { Challenge } from "@/lib/api/lobby";

interface ChallengeCardProps {
  challenge: Challenge;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  isAccepting?: boolean;
  isDeclining?: boolean;
  userBalance?: number;
}

function timeLeft(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  if (hrs > 0) return `${hrs}h ${mins % 60}m left`;
  return `${mins}m left`;
}

const ChallengeCard = ({ challenge, onAccept, onDecline, isAccepting, isDeclining, userBalance }: ChallengeCardProps) => {
  const [imgError, setImgError] = useState(false);
  const canAfford = userBalance === undefined || userBalance >= challenge.wagerAmount;
  const displayName = challenge.challengerNickname ?? challenge.creatorUsername ?? `Player #${challenge.creatorId}`;
  const avatar = challenge.challengerAvatar;

  return (
    <div className="card-player flex flex-col gap-3">
      {/* Creator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full border border-border bg-secondary flex-shrink-0 overflow-hidden flex items-center justify-center">
            {!imgError && avatar ? (
              <img
                src={avatar}
                alt={displayName}
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <span className="text-sm font-bold text-primary">
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{displayName}</p>
            {challenge.challengerWins !== undefined && (
              <p className="text-[10px] text-muted-foreground">
                {challenge.challengerWins}W / {challenge.challengerLosses ?? 0}L
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Clock className="w-3 h-3" />
          {timeLeft(challenge.expiresAt)}
        </div>
      </div>

      {/* Category */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <BookOpen className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="truncate">{challenge.categoryName}</span>
      </div>

      {/* Wager */}
      <WagerBadge amount={challenge.wagerAmount} label="Wager" size="sm" />

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => onDecline(challenge.id)}
          disabled={isDeclining}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-destructive/50 text-destructive hover:bg-destructive/10 text-xs font-medium transition-colors disabled:opacity-50"
        >
          {isDeclining ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
          Decline
        </button>
        <button
          onClick={() => onAccept(challenge.id)}
          disabled={isAccepting || !canAfford}
          className="flex-1 btn-accent flex items-center justify-center gap-1.5 text-xs disabled:opacity-50"
        >
          {isAccepting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Swords className="w-3.5 h-3.5" />}
          {isAccepting ? "Accepting..." : !canAfford ? `Need ${challenge.wagerAmount} CP` : "Accept"}
        </button>
      </div>
    </div>
  );
};

export default ChallengeCard;
