import { useQuery } from "@tanstack/react-query";
import { X, Swords, Trophy, Clock } from "lucide-react";
import { getMatch } from "@/lib/api/lobby";
import { useTournamentLeaderboard } from "@/hooks/useTournament";

interface TournamentMatchReviewProps {
  tournamentId: string;
  matchId: string;
  myUserId: number | null;
  onClose: () => void;
}

function fmtDuration(seconds: number | null | undefined): string {
  if (seconds == null) return "—";
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
}

/**
 * Head-to-head result for a knockout pairing. Knockout rounds are real
 * QuizMatch rows, and every round entry carries the `matchId` — it was returned
 * by both `round_ended` and the round-detail endpoint but had no reader, so a
 * player could see they lost a round without ever seeing the match it came
 * from.
 */
const TournamentMatchReview = ({
  tournamentId,
  matchId,
  myUserId,
  onClose,
}: TournamentMatchReviewProps) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["tournaments", "match", matchId],
    queryFn: () => getMatch(matchId),
    enabled: !!matchId,
  });

  const { data: leaderboard } = useTournamentLeaderboard(tournamentId);
  const nameFor = (userId: number) =>
    leaderboard?.participants.find((p) => p.userId === userId)?.nickname ?? `Player ${userId}`;
  const avatarFor = (userId: number) =>
    leaderboard?.participants.find((p) => p.userId === userId)?.avatarUrl ?? null;

  const match = data?.match;
  const participants = match?.participants ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Swords className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Match result</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4">
          {isLoading ? (
            <div className="py-8 flex justify-center">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : isError || !match ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Couldn&apos;t load this match.
            </p>
          ) : (
            <>
              <div className="space-y-2">
                {participants.map((p) => {
                  const isWinner = match.winnerId === p.userId;
                  const isMe = myUserId != null && p.userId === myUserId;
                  return (
                    <div
                      key={p.userId}
                      className={`flex items-center gap-3 rounded-xl p-3 border ${
                        isWinner
                          ? "bg-primary/10 border-primary/30"
                          : "bg-secondary border-transparent"
                      }`}
                    >
                      {avatarFor(p.userId) ? (
                        <img src={avatarFor(p.userId)!} alt="" className="w-9 h-9 rounded-full flex-shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                          {nameFor(p.userId).charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">
                          {isMe ? "You" : nameFor(p.userId)}
                        </p>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {fmtDuration(p.completionTime)}
                        </p>
                      </div>

                      {isWinner && <Trophy className="w-4 h-4 text-yellow-400 flex-shrink-0" />}
                      <span className="text-lg font-bold text-foreground">{p.score}</span>
                    </div>
                  );
                })}
              </div>

              <p className="mt-3 text-center text-xs text-muted-foreground">
                {match.status === "completed"
                  ? match.winnerId
                    ? `${match.winnerId === myUserId ? "You" : nameFor(match.winnerId)} advanced`
                    : "Match drawn"
                  : `Match ${match.status}`}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TournamentMatchReview;
