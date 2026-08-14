import { useState } from "react";
import { Clock, Target, Swords } from "lucide-react";
import RankBadge from "@/components/leaderboard/RankBadge";
import { useTournamentLeaderboard } from "@/hooks/useTournament";
import TournamentMatchReview from "./TournamentMatchReview";
import type { RoundResultEntry } from "@/lib/socket/events";

interface TournamentRoundResultsProps {
  tournamentId: string;
  results: RoundResultEntry[];
  myUserId: number | null;
}

/** completionTime arrives in milliseconds (last answer − first answer) */
function fmtDuration(ms: number | null): string {
  if (ms == null) return "—";
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const mins = Math.floor(seconds / 60);
  return `${mins}m ${Math.round(seconds % 60)}s`;
}

/**
 * Everyone's standing for the round just played. `round_ended` carries the full
 * results array but only ever surfaced the viewer's own rank; nicknames and
 * avatars aren't in that payload, so they're joined in from the tournament
 * leaderboard, which is already cached by the time a round ends.
 */
const TournamentRoundResults = ({
  tournamentId,
  results,
  myUserId,
}: TournamentRoundResultsProps) => {
  const [reviewMatchId, setReviewMatchId] = useState<string | null>(null);
  const { data: leaderboard } = useTournamentLeaderboard(tournamentId);

  const profileFor = (userId: number) =>
    leaderboard?.participants.find((p) => p.userId === userId);

  // Ranked entries first (byes have a null rank and never played the round).
  const ordered = [...results].sort((a, b) => {
    if (a.rank == null && b.rank == null) return 0;
    if (a.rank == null) return 1;
    if (b.rank == null) return -1;
    return a.rank - b.rank;
  });

  if (ordered.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden w-full max-w-md">
      <div className="grid grid-cols-[40px_1fr_60px_70px] gap-2 px-3 sm:px-4 py-2.5 border-b border-border text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">
        <span>#</span>
        <span>Player</span>
        <span className="text-right">Score</span>
        <span className="text-right">Time</span>
      </div>

      {ordered.map((entry, i) => {
        const profile = profileFor(entry.userId);
        const isMe = myUserId != null && entry.userId === myUserId;
        return (
          <div
            key={entry.userId}
            className={`grid grid-cols-[40px_1fr_60px_70px] gap-2 items-center px-3 sm:px-4 py-2.5 ${
              i < ordered.length - 1 ? "border-b border-border" : ""
            } ${isMe ? "bg-primary/10" : ""}`}
          >
            <div className="flex items-center justify-center">
              {entry.rank != null ? (
                <RankBadge rank={entry.rank} />
              ) : (
                <span className="text-[10px] text-muted-foreground">—</span>
              )}
            </div>

            <div className="flex items-center gap-2 min-w-0">
              {profile?.avatarUrl ? (
                <img src={profile.avatarUrl} alt="" className="w-6 h-6 rounded-full flex-shrink-0" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0">
                  {(profile?.nickname ?? "?").charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-xs font-medium text-foreground truncate">
                {isMe ? "You" : profile?.nickname ?? `Player ${entry.userId}`}
              </span>
              {entry.bye && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground flex-shrink-0">
                  bye
                </span>
              )}
            </div>

            <div className="flex items-center justify-end gap-1">
              <Target className="w-3 h-3 text-accent flex-shrink-0" />
              <span className="text-xs font-semibold text-foreground">{entry.score}</span>
            </div>

            <div className="flex items-center justify-end gap-1">
              {/* Knockout entries carry the QuizMatch they were played in */}
              {entry.matchId ? (
                <button
                  onClick={() => setReviewMatchId(entry.matchId!)}
                  className="flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 transition-colors"
                  title="View match"
                >
                  <Swords className="w-3 h-3 flex-shrink-0" />
                  Match
                </button>
              ) : (
                <>
                  <Clock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                  <span className="text-[10px] text-muted-foreground">
                    {entry.bye ? "—" : fmtDuration(entry.completionTime)}
                  </span>
                </>
              )}
            </div>
          </div>
        );
      })}

      {reviewMatchId && (
        <TournamentMatchReview
          tournamentId={tournamentId}
          matchId={reviewMatchId}
          myUserId={myUserId}
          onClose={() => setReviewMatchId(null)}
        />
      )}
    </div>
  );
};

export default TournamentRoundResults;
