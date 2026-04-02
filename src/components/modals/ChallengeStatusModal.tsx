import { X, AlertCircle, Home, ArrowLeft, Swords, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import PlayerVsCard from "@/components/challenge/PlayerVsCard";
import WagerBadge from "@/components/challenge/WagerBadge";
import CategoryTags from "@/components/challenge/CategoryTags";

export type ChallengeModalType =
  | "confirm"
  | "waiting"
  | "timeout"
  | "rejected"
  | "accepted"
  | "counter";

interface Player {
  name: string;
  avatar: string;
}

interface ChallengeStatusModalProps {
  type: ChallengeModalType;
  player: Player;
  challenger?: Player;
  categories: string[];
  wagerAmount?: number;
  counterAmount?: number;
  error?: string | null;
  onClose: () => void;
  onConfirm?: () => void;
  onCancel?: () => void;
  onResend?: () => void;
  onEditTerms?: () => void;
  onBackToLobby?: () => void;
  onAcceptCounter?: () => void;
  onDeclineCounter?: () => void;
  onTimeout?: () => void;
}

const ChallengeStatusModal = ({
  type,
  player,
  challenger,
  categories,
  wagerAmount = 0,
  counterAmount = 0,
  error,
  onClose,
  onConfirm,
  onCancel,
  onResend,
  onEditTerms,
  onBackToLobby,
  onAcceptCounter,
  onDeclineCounter,
  onTimeout,
}: ChallengeStatusModalProps) => {
  const [countdown, setCountdown] = useState(59);

  useEffect(() => {
    if (type !== "waiting") return;
    if (countdown <= 0) {
      // Auto-transition: countdown expired, trigger timeout UI
      onTimeout?.();
      return;
    }
    const timer = setInterval(() => setCountdown((p) => p - 1), 1000);
    return () => clearInterval(timer);
  }, [type, countdown, onTimeout]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6">
      <div className="bg-card border border-border rounded-2xl p-4 sm:p-8 max-w-md w-full animate-scale-in text-center relative">

        {/* ── Confirm ── */}
        {type === "confirm" && (
          <>
            <button onClick={onClose} className="absolute top-3 right-3 sm:top-4 sm:right-4 w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-muted">
              <X className="w-4 h-4" />
            </button>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <h2 className="text-base sm:text-lg font-semibold mb-4 px-2">
              Ready to challenge <span className="text-primary">{player.name}</span>?
            </h2>
            <div className="space-y-3 mb-5 text-left">
              <PlayerVsCard
                player1={challenger ?? { name: "You", avatar: player.avatar }}
                player2={player}
              />
              <CategoryTags categories={categories} label="Categories" />
              {wagerAmount > 0 && <WagerBadge amount={wagerAmount} label="Wager (held in escrow)" />}
            </div>
            <div className="flex gap-2 sm:gap-3">
              <button onClick={onCancel} className="btn-ghost flex-1 text-sm sm:text-base py-2 sm:py-3">No</button>
              <button onClick={onConfirm} className="btn-primary flex-1 bg-success hover:bg-success/90 text-sm sm:text-base py-2 sm:py-3">Yes, Challenge!</button>
            </div>
            {error && (
              <div className="mt-3 flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-xl text-destructive text-xs text-left animate-in slide-in-from-bottom-2 duration-300">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </>
        )}

        {/* ── Waiting ── */}
        {type === "waiting" && (
          <>
            <div className="mb-3 sm:mb-4">
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="hsl(var(--border))" strokeWidth="2" />
                  <circle
                    cx="18" cy="18" r="15.9" fill="none"
                    stroke="hsl(var(--primary))" strokeWidth="2"
                    strokeDasharray={`${(countdown / 59) * 100} 100`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xl sm:text-2xl font-bold text-primary">{countdown}</span>
              </div>
              <p className="text-xs text-muted-foreground">seconds remaining</p>
            </div>
            <h2 className="text-base sm:text-lg font-semibold mb-4 px-2">
              Waiting for <span className="text-primary">{player.name}</span> to respond…
            </h2>
            <div className="space-y-3 mb-5 text-left">
              <CategoryTags categories={categories} label="Categories" />
              {wagerAmount > 0 && <WagerBadge amount={wagerAmount} />}
            </div>
            <button onClick={onCancel} className="btn-ghost w-full text-sm py-2.5">Cancel Challenge</button>
          </>
        )}

        {/* ── Timeout ── */}
        {type === "timeout" && (
          <>
            <h2 className="text-3xl sm:text-4xl font-bold text-destructive mb-2">Time Out</h2>
            <p className="text-muted-foreground text-sm sm:text-base mb-4">No response from {player.name}</p>
            <div className="space-y-3 mb-5 text-left">
              <CategoryTags categories={categories} label="Categories" />
              {wagerAmount > 0 && <WagerBadge amount={wagerAmount} />}
            </div>
            <div className="flex gap-2 sm:gap-3">
              <button onClick={onCancel} className="btn-ghost flex-1 text-sm sm:text-base py-2 sm:py-3">Cancel</button>
              <button onClick={onResend} className="btn-primary flex-1 text-sm sm:text-base py-2 sm:py-3">Resend</button>
            </div>
          </>
        )}

        {/* ── Rejected ── */}
        {type === "rejected" && (
          <>
            <div className="border-2 border-destructive rounded-xl py-2 px-4 mb-3 sm:mb-4 inline-block">
              <h2 className="text-xl sm:text-2xl font-bold text-destructive">Challenge Rejected</h2>
            </div>
            <p className="text-muted-foreground text-sm mb-4">{player.name} declined your challenge</p>
            {wagerAmount > 0 && (
              <div className="mb-4 text-left">
                <WagerBadge amount={wagerAmount} label="Wager refunded" />
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button onClick={onEditTerms} className="btn-ghost flex-1 flex items-center justify-center gap-2 text-sm py-2.5">
                <ArrowLeft className="w-4 h-4" /> Edit Terms
              </button>
              <button onClick={onBackToLobby} className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm py-2.5">
                <Home className="w-4 h-4" /> Back to Lobby
              </button>
            </div>
          </>
        )}

        {/* ── Accepted ── */}
        {type === "accepted" && (
          <>
            <div className="flex items-center justify-center gap-2 text-success mb-4 sm:mb-6">
              <Swords className="w-5 h-5 sm:w-6 sm:h-6" />
              <h2 className="text-xl sm:text-2xl font-bold">Challenge Accepted!</h2>
            </div>
            <PlayerVsCard
              player1={challenger ?? { name: "You", avatar: player.avatar }}
              player2={player}
              label="Get ready to battle"
            />
            {wagerAmount > 0 && (
              <div className="mt-3 text-left">
                <WagerBadge amount={wagerAmount} label="Prize pool" />
              </div>
            )}
          </>
        )}

        {/* ── Counter offer ── */}
        {type === "counter" && (
          <>
            <button onClick={onClose} className="absolute top-3 right-3 sm:top-4 sm:right-4 w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-muted">
              <X className="w-4 h-4" />
            </button>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-warning/20 flex items-center justify-center mx-auto mb-3">
              <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-warning" />
            </div>
            <h2 className="text-base sm:text-lg font-semibold mb-1">Counter Offer</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mb-4">
              <span className="text-primary font-medium">{player.name}</span> wants to change the wager
            </p>
            <div className="space-y-3 mb-5 text-left">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-secondary rounded-xl text-center">
                  <p className="text-[10px] text-muted-foreground mb-1">Your offer</p>
                  <p className="text-sm font-bold text-foreground">{wagerAmount.toLocaleString()} MP</p>
                </div>
                <div className="p-3 bg-warning/10 border border-warning/30 rounded-xl text-center">
                  <p className="text-[10px] text-muted-foreground mb-1">Their counter</p>
                  <p className="text-sm font-bold text-warning">{counterAmount.toLocaleString()} MP</p>
                </div>
              </div>
              <CategoryTags categories={categories} label="Categories" />
            </div>
            <div className="flex gap-2 sm:gap-3">
              <button onClick={onDeclineCounter} className="btn-ghost flex-1 text-sm py-2.5">Decline</button>
              <button onClick={onAcceptCounter} className="btn-primary flex-1 text-sm py-2.5 bg-warning hover:bg-warning/90 text-background">
                Accept {counterAmount.toLocaleString()} MP
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChallengeStatusModal;
