import { useState, useEffect } from "react";
import { Swords, Zap, X } from "lucide-react";
import PlayerVsCard from "@/components/challenge/PlayerVsCard";
import WagerBadge from "@/components/challenge/WagerBadge";
import CategoryTags from "@/components/challenge/CategoryTags";

interface IncomingChallengeModalProps {
  challenger: {
    name: string;
    avatar: string;
    points: number;
  };
  me: {
    name: string;
    avatar: string;
  };
  categories: string[];
  wagerAmount: number;
  expiresInSeconds?: number;
  onAccept: () => void;
  onDecline: () => void;
  onCounter: (newAmount: number) => void;
  onClose: () => void;
  counterError?: string | null;
  acceptError?: string | null;
  isAccepting?: boolean;
}

const COUNTER_PRESETS = [50, 100, 200, 500];

const IncomingChallengeModal = ({
  challenger,
  me,
  categories,
  wagerAmount,
  expiresInSeconds = 59,
  onAccept,
  onDecline,
  onCounter,
  onClose,
  counterError: externalCounterError,
  acceptError,
  isAccepting = false,
}: IncomingChallengeModalProps) => {
  const [timeLeft, setTimeLeft] = useState(expiresInSeconds);
  const [showCounter, setShowCounter] = useState(false);
  const [counterError, setCounterError] = useState<string | null>(null);

  // Sync external error into local state
  useEffect(() => {
    if (externalCounterError) setCounterError(externalCounterError);
  }, [externalCounterError]);
  const [counterAmount, setCounterAmount] = useState(wagerAmount);
  const [customCounter, setCustomCounter] = useState("");

  useEffect(() => {
    if (timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft]);

  const effectiveCounter = customCounter ? parseInt(customCounter) || 0 : counterAmount;

  const handleCounter = () => {
    if (effectiveCounter > 0) {
      setCounterError(null);
      onCounter(effectiveCounter);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6">
      <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 max-w-md w-full animate-scale-in max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-accent">
            <Swords className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider">Incoming Challenge!</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Countdown ring */}
            <div className="relative w-8 h-8">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="hsl(var(--border))" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15.9" fill="none"
                  stroke="hsl(var(--primary))" strokeWidth="3"
                  strokeDasharray={`${(timeLeft / expiresInSeconds) * 100} 100`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-primary">{timeLeft}</span>
            </div>
            <button onClick={onClose} className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center hover:bg-muted">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* VS card */}
        <div className="mb-4">
          <PlayerVsCard player1={challenger} player2={me} label="Battle request" />
        </div>

        {/* Challenger stats */}
        <div className="flex items-center gap-1.5 justify-center mb-4 text-xs text-muted-foreground">
          <Zap className="w-3.5 h-3.5 text-warning" />
          <span>{challenger.points.toLocaleString()} Morgan Points</span>
        </div>

        {/* Categories + wager */}
        <div className="space-y-3 mb-5">
          <CategoryTags categories={categories} label="Categories" />
          {wagerAmount > 0 && <WagerBadge amount={wagerAmount} label="Wager at stake" />}
        </div>

        {/* Counter offer section */}
        {showCounter && (
          <div className="mb-4 space-y-3 p-3 bg-secondary rounded-xl">
            <p className="text-xs font-semibold text-foreground uppercase tracking-wider">Propose counter wager</p>
            <div className="grid grid-cols-4 gap-1.5">
              {COUNTER_PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => { setCounterAmount(p); setCustomCounter(""); }}
                  className={`py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    counterAmount === p && !customCounter
                      ? "bg-primary border-primary text-primary-foreground"
                      : "bg-card border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {p} MP
                </button>
              ))}
            </div>
            <div className="relative">
              <Zap className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-warning pointer-events-none" />
              <input
                type="number"
                value={customCounter}
                onChange={(e) => setCustomCounter(e.target.value)}
                placeholder="Custom MP amount"
                className="input-dark w-full pl-8 text-xs py-2"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowCounter(false)} className="btn-ghost flex-1 text-xs py-2">Cancel</button>
              <button onClick={handleCounter} disabled={effectiveCounter <= 0} className="btn-primary flex-1 text-xs py-2 disabled:opacity-40">
                Send Counter
              </button>
            </div>
            {counterError && (
              <p className="text-xs text-destructive text-center animate-in slide-in-from-bottom-1 duration-200">{counterError}</p>
            )}
          </div>
        )}

        {/* Action buttons */}
        {!showCounter && (
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={onDecline}
                disabled={isAccepting}
                className="py-3 rounded-xl border border-destructive/50 text-destructive hover:bg-destructive/10 text-xs sm:text-sm font-medium transition-colors disabled:opacity-40"
              >
                Decline
              </button>
              <button
                onClick={() => setShowCounter(true)}
                disabled={isAccepting}
                className="py-3 rounded-xl border border-warning/50 text-warning hover:bg-warning/10 text-xs sm:text-sm font-medium transition-colors disabled:opacity-40"
              >
                Counter
              </button>
              <button
                onClick={onAccept}
                disabled={isAccepting}
                className="py-3 rounded-xl bg-success hover:bg-success/90 text-background text-xs sm:text-sm font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {isAccepting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-background/40 border-t-background rounded-full animate-spin" />
                    <span>Joining…</span>
                  </>
                ) : "Accept"}
              </button>
            </div>
            {acceptError && (
              <p className="text-xs text-destructive text-center animate-in slide-in-from-bottom-1 duration-200">{acceptError}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default IncomingChallengeModal;
