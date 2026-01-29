import { useEffect, useState } from "react";
import { Swords } from "lucide-react";

interface ChallengeIntroProps {
  player1: {
    name: string;
    avatar: string;
  };
  player2: {
    name: string;
    avatar: string;
  };
  onComplete: () => void;
}

const ChallengeIntro = ({ player1, player2, onComplete }: ChallengeIntroProps) => {
  const [stage, setStage] = useState<"intro" | "scoreboard">("intro");

  useEffect(() => {
    // Show intro for 2 seconds, then scoreboard for 2 seconds
    const timer1 = setTimeout(() => {
      setStage("scoreboard");
    }, 2000);

    const timer2 = setTimeout(() => {
      onComplete();
    }, 4000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onComplete]);

  if (stage === "intro") {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center p-4">
        {/* Green glow effect at top */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 sm:w-96 h-32 sm:h-48 bg-gradient-radial from-primary/30 to-transparent blur-3xl" />

        <div className="text-center animate-scale-in w-full max-w-lg">
          <div className="bg-card border border-border rounded-2xl px-4 sm:px-12 py-6 sm:py-8">
            <div className="flex items-center gap-2 text-accent mb-4 sm:mb-6 justify-center">
              <Swords className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-base sm:text-lg font-medium">The Challenge is on...</span>
            </div>

            <div className="flex items-center justify-center gap-3 sm:gap-8 flex-wrap">
              <div className="flex items-center gap-2 sm:gap-3">
                <img
                  src={player1.avatar}
                  alt={player1.name}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-primary"
                />
                <span className="text-xs sm:text-sm font-medium text-foreground">{player1.name}</span>
              </div>

              <span className="text-lg sm:text-xl font-bold text-primary">Vs</span>

              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-xs sm:text-sm font-medium text-foreground">{player2.name}</span>
                <img
                  src={player2.avatar}
                  alt={player2.name}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-pink-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center p-4">
      {/* Green glow effect at top */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 sm:w-96 h-32 sm:h-48 bg-gradient-radial from-primary/30 to-transparent blur-3xl" />

      {/* Title */}
      <div className="flex items-center gap-2 text-primary mb-8 sm:mb-12">
        <Swords className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="text-xs sm:text-sm font-medium">Friendly Challenge</span>
      </div>

      {/* Scoreboard */}
      <div className="animate-fade-in w-full max-w-xl">
        <div className="flex flex-col items-center">
          <span className="text-[10px] sm:text-xs text-muted-foreground mb-3 sm:mb-4">Zeta points won</span>
          <div className="bg-card border border-border rounded-xl px-4 sm:px-12 py-4 sm:py-6 w-full">
            <div className="flex items-center justify-between sm:justify-center gap-2 sm:gap-12">
              <div className="flex items-center gap-2 sm:gap-3">
                <img
                  src={player1.avatar}
                  alt={player1.name}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-primary"
                />
                <span className="text-xs sm:text-sm text-muted-foreground hidden xs:inline">{player1.name}</span>
                <span className="text-xl sm:text-3xl font-bold text-foreground">0</span>
              </div>

              <span className="text-xl sm:text-2xl text-accent font-bold">⚡</span>

              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-xl sm:text-3xl font-bold text-foreground">0</span>
                <span className="text-xs sm:text-sm text-muted-foreground hidden xs:inline">{player2.name}</span>
                <img
                  src={player2.avatar}
                  alt={player2.name}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-pink-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChallengeIntro;
