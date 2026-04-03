import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Lock, Zap, Trophy, Swords, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TournamentLockModalProps {
  open: boolean;
  onClose: () => void;
}

const TournamentLockModal = ({ open, onClose }: TournamentLockModalProps) => {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="w-[92vw] max-w-sm sm:max-w-md border-0 p-0 bg-transparent shadow-none rounded-2xl [&>button]:hidden">
        <DialogTitle className="sr-only">Tournament Access Locked</DialogTitle>

        <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
          {/* Animated gradient top bar */}
          <div
            className="h-1 sm:h-1.5 w-full"
            style={{
              background:
                "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)), #facc15, hsl(var(--primary)))",
              backgroundSize: "200% 100%",
              animation: "shimmer 3s ease-in-out infinite",
            }}
          />

          {/* Floating particles background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full opacity-10"
                style={{
                  width: `${6 + i * 3}px`,
                  height: `${6 + i * 3}px`,
                  background: "hsl(var(--accent))",
                  left: `${15 + i * 15}%`,
                  top: `${20 + (i % 3) * 25}%`,
                  animation: `float ${3 + i * 0.5}s ease-in-out infinite ${i * 0.3}s`,
                }}
              />
            ))}
          </div>

          {/* Content */}
          <div className="relative px-4 sm:px-6 pt-6 sm:pt-8 pb-5 sm:pb-6 text-center space-y-4 sm:space-y-5">
            {/* Lock icon with pulse ring */}
            <div className="relative mx-auto w-16 h-16 sm:w-20 sm:h-20">
              <div
                className="absolute inset-0 rounded-full bg-accent/20"
                style={{ animation: "ping-slow 2s ease-out infinite" }}
              />
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-accent/30 to-primary/20 border border-accent/30 flex items-center justify-center backdrop-blur-sm">
                <Lock
                  className="w-6 h-6 sm:w-8 sm:h-8 text-accent"
                  style={{ animation: "lock-bounce 2s ease-in-out infinite" }}
                />
              </div>
            </div>

            {/* Title */}
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-foreground mb-0.5 sm:mb-1">
                Tournament Arena Locked
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Exclusive access for top players
              </p>
            </div>

            {/* Requirement card */}
            <div className="bg-secondary/80 rounded-xl p-3 sm:p-4 border border-border space-y-2 sm:space-y-3">
              <div className="flex items-center justify-center gap-2">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
                <span className="text-base sm:text-lg font-bold text-foreground">
                  10,000 Morgan Points
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">
                You need at least <span className="text-yellow-400 font-semibold">10,000 MP</span> to
                participate in tournaments. Keep playing and winning!
              </p>
            </div>

            {/* Tips row */}
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              {[
                { icon: Swords, label: "Play Challenges", sub: "Win MP" },
                { icon: Trophy, label: "Climb Ranks", sub: "Earn more" },
                { icon: Star, label: "Daily Bonus", sub: "Free MP" },
              ].map(({ icon: Icon, label, sub }) => (
                <div
                  key={label}
                  className="bg-background rounded-lg p-2 sm:p-3 border border-border/50 space-y-0.5 sm:space-y-1"
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent mx-auto" />
                  <p className="text-[9px] sm:text-[10px] font-medium text-foreground leading-tight">{label}</p>
                  <p className="text-[9px] sm:text-[10px] text-muted-foreground">{sub}</p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <Button
              onClick={onClose}
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold text-xs sm:text-sm"
            >
              <Swords className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              Go Win Some Challenges!
            </Button>

            <p className="text-[9px] sm:text-[10px] text-muted-foreground/60">
              Tournaments are coming soon. Stay sharp! 🔥
            </p>
          </div>
        </div>

        {/* Keyframe animations */}
        <style>{`
          @keyframes shimmer {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0) scale(1); }
            50% { transform: translateY(-12px) scale(1.2); }
          }
          @keyframes ping-slow {
            0% { transform: scale(1); opacity: 0.3; }
            75%, 100% { transform: scale(1.6); opacity: 0; }
          }
          @keyframes lock-bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-3px); }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
};

export default TournamentLockModal;
