import { X, AlertCircle, Home, ArrowLeft, Swords } from "lucide-react";
import { useEffect, useState } from "react";

type ModalType = "confirm" | "waiting" | "timeout" | "rejected" | "accepted";

interface ChallengeStatusModalProps {
  type: ModalType;
  player: {
    name: string;
    avatar: string;
  };
  challenger?: {
    name: string;
    avatar: string;
  };
  categories: string[];
  onClose: () => void;
  onConfirm?: () => void;
  onCancel?: () => void;
  onResend?: () => void;
  onEditTerms?: () => void;
  onBackToLobby?: () => void;
}

const ChallengeStatusModal = ({
  type,
  player,
  challenger,
  categories,
  onClose,
  onConfirm,
  onCancel,
  onResend,
  onEditTerms,
  onBackToLobby,
}: ChallengeStatusModalProps) => {
  const [countdown, setCountdown] = useState(59);

  useEffect(() => {
    if (type === "waiting" && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [type, countdown]);

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6">
      <div className="bg-card border border-border rounded-2xl p-4 sm:p-8 max-w-md w-full animate-scale-in text-center relative">
        {type === "confirm" && (
          <>
            <button
              onClick={onClose}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-muted"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>

            <h2 className="text-base sm:text-lg font-semibold mb-4 sm:mb-6 px-2">Are you sure you want to challenge this player?</h2>

            {/* Player info */}
            <div className="bg-secondary rounded-xl p-3 sm:p-4 mb-4">
              <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <img src={player.avatar} alt={player.name} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full" />
                <span className="font-medium text-sm sm:text-base">{player.name}</span>
              </div>
              <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
                {categories.map((cat) => (
                  <span key={cat} className="badge-category-outline text-xs sm:text-sm">
                    {cat}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-2 sm:gap-3">
              <button onClick={onCancel} className="btn-ghost flex-1 text-sm sm:text-base py-2 sm:py-3">
                No
              </button>
              <button onClick={onConfirm} className="btn-primary flex-1 bg-success hover:bg-success/90 text-sm sm:text-base py-2 sm:py-3">
                Yes
              </button>
            </div>
          </>
        )}

        {type === "waiting" && (
          <>
            <div className="mb-3 sm:mb-4">
              <span className="text-4xl sm:text-5xl font-bold text-primary">{countdown}</span>
              <p className="text-muted-foreground text-sm sm:text-base">Seconds</p>
            </div>

            <h2 className="text-base sm:text-lg font-semibold mb-4 sm:mb-6 px-2">Waiting for player to accept challenge</h2>

            <div className="bg-secondary rounded-xl p-3 sm:p-4">
              <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <img src={player.avatar} alt={player.name} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full" />
                <span className="font-medium text-sm sm:text-base">{player.name}</span>
              </div>
              <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
                {categories.map((cat) => (
                  <span key={cat} className="badge-category-outline text-xs sm:text-sm">
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}

        {type === "timeout" && (
          <>
            <h2 className="text-3xl sm:text-4xl font-bold text-destructive mb-2">Time Out</h2>
            <p className="text-muted-foreground text-sm sm:text-base mb-4 sm:mb-6">No response</p>

            <div className="bg-secondary rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
              <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <img src={player.avatar} alt={player.name} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full" />
                <span className="font-medium text-sm sm:text-base">{player.name}</span>
              </div>
              <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
                {categories.map((cat) => (
                  <span key={cat} className="badge-category-outline text-xs sm:text-sm">
                    {cat}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-2 sm:gap-3">
              <button onClick={onCancel} className="btn-ghost flex-1 text-sm sm:text-base py-2 sm:py-3">
                Cancel
              </button>
              <button onClick={onResend} className="btn-primary flex-1 text-sm sm:text-base py-2 sm:py-3">
                Resend
              </button>
            </div>
          </>
        )}

        {type === "rejected" && (
          <>
            <div className="border-2 border-destructive rounded-xl py-2 px-3 sm:px-6 mb-3 sm:mb-4 inline-block">
              <h2 className="text-xl sm:text-3xl font-bold text-destructive">Challenge Rejected</h2>
            </div>

            <p className="text-muted-foreground text-sm sm:text-base mb-4 sm:mb-6">The player rejected your challenge</p>

            <div className="bg-secondary rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
              <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <img src={player.avatar} alt={player.name} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full" />
                <span className="font-medium text-sm sm:text-base">{player.name}</span>
              </div>
              <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
                {categories.map((cat) => (
                  <span key={cat} className="badge-category-outline text-xs sm:text-sm">
                    {cat}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button onClick={onEditTerms} className="btn-ghost flex-1 flex items-center justify-center gap-2 text-sm sm:text-base py-2 sm:py-3">
                <ArrowLeft className="w-4 h-4" />
                Edit Terms
              </button>
              <button onClick={onBackToLobby} className="btn-primary flex-1 flex items-center justify-center gap-2 text-sm sm:text-base py-2 sm:py-3">
                <Home className="w-4 h-4" />
                Back to lobby
              </button>
            </div>
          </>
        )}

        {type === "accepted" && (
          <>
            <div className="flex items-center justify-center gap-2 text-success mb-4 sm:mb-6">
              <Swords className="w-5 h-5 sm:w-6 sm:h-6" />
              <h2 className="text-xl sm:text-3xl font-bold">Challenge accepted</h2>
            </div>

            <div className="bg-secondary rounded-xl p-4 sm:p-6">
              <div className="flex items-center justify-center gap-3 sm:gap-8 flex-wrap">
                <div className="flex items-center gap-2 sm:gap-3">
                  <img
                    src={challenger?.avatar || player.avatar}
                    alt={challenger?.name || "You"}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full"
                  />
                  <span className="font-medium text-sm sm:text-base">{challenger?.name || "King_Minkk"}</span>
                </div>

                <span className="text-xl sm:text-2xl font-bold text-primary">Vs</span>

                <div className="flex items-center gap-2 sm:gap-3">
                  <img src={player.avatar} alt={player.name} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full" />
                  <span className="font-medium text-sm sm:text-base">{player.name}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChallengeStatusModal;
