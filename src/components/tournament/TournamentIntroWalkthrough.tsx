import { useState } from "react";
import { Trophy, Layers, Zap, Gift, ArrowRight, ArrowLeft } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FORMAT_LABELS, FORMAT_COLORS, type TournamentFormat } from "@/lib/api/tournament";

interface TournamentIntroWalkthroughProps {
  open: boolean;
  onFinish: () => void;
}

const FORMAT_ORDER: TournamentFormat[] = ["classic", "speed_run", "knockout", "battle_royale"];

// Same substance as FormatBadge's tooltip copy, reworded to stand on its own
// without a hover — this is the one screen where a first-time player is
// expected to actually read it, not just have it available on demand.
const FORMAT_SUMMARY: Record<TournamentFormat, string> = {
  classic: "Same 10 questions as everyone else. Highest score wins.",
  speed_run: "Same questions, but speed decides it — fastest correct answers win.",
  knockout: "1-on-1 bracket. Win your match, advance. Lose, and you're out.",
  battle_royale: "Everyone plays every round. Lowest scorers get cut each round.",
};

type Step = {
  icon: typeof Trophy;
  eyebrow: string;
  title: string;
  render: () => React.ReactNode;
};

const STEPS: Step[] = [
  {
    icon: Trophy,
    eyebrow: "Welcome",
    title: "Compete for real prizes",
    render: () => (
      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
        A tournament pits you against other real players answering real trivia — not against the
        house. Some are free to join; others charge a small entry fee that goes straight into the
        prize pool you're all competing for. Everything you win pays out in Morgan Points (MP).
      </p>
    ),
  },
  {
    icon: Layers,
    eyebrow: "Formats",
    title: "Four ways to compete",
    render: () => (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {FORMAT_ORDER.map((format) => (
          <div key={format} className="rounded-lg border border-border bg-card p-3">
            <span
              className={`inline-flex px-2 py-0.5 text-[10px] sm:text-xs font-medium rounded mb-1.5 ${FORMAT_COLORS[format]}`}
            >
              {FORMAT_LABELS[format]}
            </span>
            <p className="text-xs sm:text-sm text-muted-foreground leading-snug">
              {FORMAT_SUMMARY[format]}
            </p>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: Zap,
    eyebrow: "Gameplay",
    title: "Register, then just show up",
    render: () => (
      <ul className="space-y-2.5 text-sm sm:text-base text-muted-foreground">
        <li className="flex gap-2">
          <span className="text-primary font-semibold">1.</span>
          Register before the deadline — you can browse and confirm before committing anything.
        </li>
        <li className="flex gap-2">
          <span className="text-primary font-semibold">2.</span>
          When it starts, you're pulled straight into your round or match automatically. No need
          to keep watching the clock.
        </li>
        <li className="flex gap-2">
          <span className="text-primary font-semibold">3.</span>
          Answer fast <em>and</em> correctly — most formats reward both, exactly like a normal
          Hallos match.
        </li>
      </ul>
    ),
  },
  {
    icon: Gift,
    eyebrow: "Prizes",
    title: "Top finishers split the pool",
    render: () => (
      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
        The prize pool is split among the top 3 finishers — 1st place gets the largest share, then
        2nd, then 3rd. Your placement and any prize show up the moment the tournament ends, and MP
        is credited automatically — nothing to claim manually.
      </p>
    ),
  },
];

/**
 * First-time-only walkthrough for the tournament section, shown once per
 * account (see tournamentOnboardingStore) and re-openable anytime via the
 * "How it works" button in TournamentArena's header. Addresses the QA
 * finding that tournaments weren't self-explanatory — a player landing here
 * cold had no in-context explanation of formats, flow, or payouts before this.
 */
const TournamentIntroWalkthrough = ({ open, onFinish }: TournamentIntroWalkthroughProps) => {
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];
  const Icon = current.icon;

  const handleClose = () => {
    setStep(0);
    onFinish();
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) handleClose(); }}>
      <DialogContent className="max-w-lg" onInteractOutside={(e) => e.preventDefault()}>
        <div className="flex items-center gap-1.5 mb-1">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? "w-6 bg-primary" : i < step ? "w-1.5 bg-primary/60" : "w-1.5 bg-muted"
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-3 pt-2">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {current.eyebrow}
            </p>
            <h2 className="text-base sm:text-lg font-bold text-foreground">{current.title}</h2>
          </div>
        </div>

        <div className="min-h-[120px] py-1">{current.render()}</div>

        <div className="flex items-center justify-between pt-2">
          <button
            onClick={handleClose}
            className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip
          </button>
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="outline" size="sm" onClick={() => setStep((s) => s - 1)}>
                <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back
              </Button>
            )}
            <Button size="sm" onClick={() => (isLast ? handleClose() : setStep((s) => s + 1))}>
              {isLast ? "Let's go" : "Next"}
              {!isLast && <ArrowRight className="w-3.5 h-3.5 ml-1" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TournamentIntroWalkthrough;
