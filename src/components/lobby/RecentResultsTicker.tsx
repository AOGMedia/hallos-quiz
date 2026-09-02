import { Trophy, Swords } from "lucide-react";
import type { LiveMatchResult } from "@/lib/api/lobby";

/** Seconds each result takes to traverse the strip. Higher reads slower. */
const SECONDS_PER_ITEM = 6;

function timeAgo(endedAt: number): string {
  const seconds = Math.max(0, Math.floor((Date.now() - endedAt) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

const ResultChip = ({
  result,
  ariaHidden = false,
}: {
  result: LiveMatchResult;
  ariaHidden?: boolean;
}) => {
  const [a, b] = result.players;
  if (!a || !b) return null;

  // Order so the winner reads first: "X beat Y". A draw (no winnerId) keeps
  // the original order and reads as a draw instead.
  const hasWinner = result.winnerId != null;
  const winner = hasWinner ? (a.userId === result.winnerId ? a : b) : a;
  const loser = hasWinner ? (a.userId === result.winnerId ? b : a) : b;
  const isTournament = result.matchType === "tournament";

  return (
    <div
      aria-hidden={ariaHidden || undefined}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background border border-border flex-shrink-0"
    >
      {isTournament ? (
        <Trophy className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
      ) : (
        <Swords className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
      )}
      <span className="text-xs whitespace-nowrap">
        <span className="font-semibold text-foreground">{winner.nickname}</span>
        <span className="text-muted-foreground">{hasWinner ? " beat " : " drew "}</span>
        <span className="font-medium text-foreground">{loser.nickname}</span>
        <span className="text-primary font-semibold ml-1.5">
          {winner.score}&ndash;{loser.score}
        </span>
      </span>
      <span className="text-[11px] text-muted-foreground whitespace-nowrap flex-shrink-0">
        {timeAgo(result.endedAt)}
      </span>
    </div>
  );
};

/**
 * A gliding strip of recently finished matches. Chosen over a stacked list
 * because results can arrive in bursts: a ticker absorbs any number of them in
 * fixed vertical space, and never reflows the page when one lands.
 *
 * The list is rendered twice and the track translates exactly -50%, so the
 * animation loops on a pixel identical frame with no visible seam.
 */
const RecentResultsTicker = ({ results }: { results: LiveMatchResult[] }) => {
  if (results.length === 0) return null;

  // Scale duration to the content so more results glide for longer rather than
  // speeding up into an unreadable blur.
  const durationSeconds = results.length * SECONDS_PER_ITEM;

  return (
    <div className="ticker-track relative overflow-hidden">
      <div
        className="flex gap-2 w-max animate-ticker"
        style={{ animationDuration: `${durationSeconds}s` }}
      >
        {results.map((result) => (
          <ResultChip key={result.matchId} result={result} />
        ))}
        {/* Second pass exists only to make the loop seamless. Each chip is
            marked aria-hidden individually rather than wrapped, because a
            wrapper would introduce a gap the -50% translate doesn't account
            for and the loop would visibly jump. */}
        {results.map((result) => (
          <ResultChip key={`dup-${result.matchId}`} result={result} ariaHidden />
        ))}
      </div>

      {/* Soft edges so chips fade in and out instead of clipping hard. */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-card to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-card to-transparent" />
    </div>
  );
};

export default RecentResultsTicker;
