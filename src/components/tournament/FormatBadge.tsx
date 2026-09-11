import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FORMAT_LABELS, FORMAT_COLORS, type TournamentFormat } from "@/lib/api/tournament";

interface FormatBadgeProps {
  format: TournamentFormat;
  size?: "sm" | "md";
  /** Show a small (i) that explains the format on hover/tap. Off by default
   * so dense lists (cards, tables) stay visually unchanged — opt in on the
   * one or two screens where a first-time user is actually choosing a format. */
  withExplainer?: boolean;
}

// A colored label alone doesn't tell a first-time user what "Knockout" or
// "Battle Royale" actually means (bracket size, elimination rule, byes) —
// this was one of the concrete gaps behind "tournament navigation isn't
// straightforward."
const FORMAT_EXPLAINERS: Record<TournamentFormat, string> = {
  classic: "Everyone answers the same question set. Highest score wins — time only breaks a tie.",
  speed_run: "Everyone answers the same questions. Fastest correct answers wins, not just the most correct.",
  knockout: "1-on-1 bracket. Lose your match and you're out. An odd player count gets one free bye to the next round.",
  battle_royale: "Everyone plays every round. The lowest scorers are eliminated each round until one champion remains.",
};

const FormatBadge = ({ format, size = "md", withExplainer = false }: FormatBadgeProps) => {
  const badge = (
    <span
      className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 font-medium rounded whitespace-nowrap ${FORMAT_COLORS[format]} ${
        size === "sm" ? "text-[10px]" : "text-[10px] sm:text-xs"
      }`}
    >
      {FORMAT_LABELS[format]}
      {withExplainer && <Info className="w-3 h-3 opacity-70" />}
    </span>
  );

  if (!withExplainer) return badge;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" className="cursor-help">{badge}</button>
        </TooltipTrigger>
        <TooltipContent className="max-w-[220px] text-xs">
          {FORMAT_EXPLAINERS[format]}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default FormatBadge;
