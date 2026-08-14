import { useState } from "react";
import { ChevronLeft, Clock, Target, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import RankBadge from "@/components/leaderboard/RankBadge";
import TournamentRoundResults from "./TournamentRoundResults";
import { useTournamentLeaderboard, useTournamentRound } from "@/hooks/useTournament";
import { getMyUserId } from "@/lib/auth/currentUser";

interface TournamentLeaderboardViewProps {
  tournamentId: string;
  tournamentName?: string;
  onBack: () => void;
}

const TournamentLeaderboardView = ({
  tournamentId,
  tournamentName,
  onBack,
}: TournamentLeaderboardViewProps) => {
  const { data, isLoading } = useTournamentLeaderboard(tournamentId);

  const isComplete = data?.status === "completed";
  const myUserId = getMyUserId();
  const winner = data?.participants.find((p) => p.placement === 1);
  const me = myUserId != null ? data?.participants.find((p) => p.userId === myUserId) : undefined;

  // null = overall standings; a number = that round's results
  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  const playedRounds = Math.min(data?.currentRound ?? 0, data?.totalRounds ?? 0);

  const { data: roundDetail, isLoading: roundLoading } = useTournamentRound(
    tournamentId,
    selectedRound ?? 0,
    { enabled: selectedRound != null }
  );

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5 sm:mb-6">
        <Button variant="outline" size="icon" onClick={onBack}
          className="bg-card border-border hover:bg-muted rounded-full w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
        <div>
          <h1 className="text-base sm:text-xl font-bold text-foreground">Live Standings</h1>
          {tournamentName && (
            <p className="text-xs text-muted-foreground truncate">{tournamentName}</p>
          )}
        </div>
        {data && (
          isComplete ? (
            <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 bg-muted border border-border rounded-lg">
              <Trophy className="w-3 h-3 text-yellow-400" />
              <span className="text-[10px] sm:text-xs text-muted-foreground font-medium">Final</span>
            </div>
          ) : (
            <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 bg-primary/20 border border-primary/30 rounded-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="text-[10px] sm:text-xs text-primary font-medium">
                Round {data.currentRound}/{data.totalRounds}
              </span>
            </div>
          )
        )}
      </div>

      {/* Final result banner — the tournament's payout was previously only ever
          announced as a toast, which is gone the moment it's dismissed. */}
      {isComplete && winner && (
        <div className="bg-card border border-border rounded-xl p-4 sm:p-5 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-yellow-500/20 flex items-center justify-center text-2xl sm:text-3xl flex-shrink-0">
              🏆
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">Winner</p>
              <p className="text-base sm:text-xl font-bold text-foreground truncate">{winner.nickname}</p>
              {winner.prizeWon > 0 && (
                <p className="text-xs sm:text-sm text-yellow-400 font-medium">
                  {winner.prizeWon.toLocaleString()} MP
                </p>
              )}
            </div>
          </div>

          {me && (
            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs sm:text-sm">
              <span className="text-muted-foreground">
                You finished{" "}
                <span className="text-foreground font-medium">
                  {me.placement != null ? `#${me.placement}` : `#${me.rank}`}
                </span>
                {" "}of {data.participants.length}
              </span>
              <span className={me.prizeWon > 0 ? "text-green-400 font-medium" : "text-muted-foreground"}>
                {me.prizeWon > 0 ? `+${me.prizeWon.toLocaleString()} MP` : "No prize"}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Round selector — overall standings, or a single round's results.
          Backed by the round-detail endpoint, so it works for finished rounds
          and for knockout, where the per-round result lives on a match. */}
      {playedRounds > 0 && (
        <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 scrollbar-hide">
          <Button
            variant={selectedRound === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedRound(null)}
            className={`whitespace-nowrap text-xs flex-shrink-0 ${
              selectedRound === null
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-card border-border hover:bg-muted"
            }`}
          >
            Standings
          </Button>
          {Array.from({ length: playedRounds }, (_, i) => i + 1).map((n) => (
            <Button
              key={n}
              variant={selectedRound === n ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedRound(n)}
              className={`whitespace-nowrap text-xs flex-shrink-0 ${
                selectedRound === n
                  ? "bg-accent text-accent-foreground hover:bg-accent/90"
                  : "bg-card border-border hover:bg-muted"
              }`}
            >
              Round {n}
            </Button>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-14 bg-card border border-border rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Single-round view */}
      {selectedRound != null && (
        roundLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-card border border-border rounded-xl animate-pulse" />
            ))}
          </div>
        ) : roundDetail?.round.participants?.length ? (
          <div className="w-full">
            <TournamentRoundResults
              tournamentId={tournamentId}
              results={roundDetail.round.participants}
              myUserId={myUserId}
            />
          </div>
        ) : (
          <p className="text-xs sm:text-sm text-muted-foreground py-8 text-center">
            Round {selectedRound} hasn&apos;t produced any results yet.
          </p>
        )
      )}

      {selectedRound === null && data && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {/* Column headers */}
          <div className="grid grid-cols-[40px_1fr_70px_70px_60px] gap-2 px-3 sm:px-4 py-2.5 border-b border-border text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider">
            <span>#</span>
            <span>Player</span>
            <span className="text-right">Score</span>
            <span className="text-right hidden sm:block">Avg Time</span>
            <span className="text-right">{isComplete ? "Prize" : "Status"}</span>
          </div>

          {data.participants.map((p, i) => (
            <div
              key={p.userId}
              className={`grid grid-cols-[40px_1fr_70px_70px_60px] gap-2 items-center px-3 sm:px-4 py-3 transition-colors hover:bg-muted/50 ${
                i < data.participants.length - 1 ? "border-b border-border" : ""
              } ${p.rank <= 3 ? "bg-primary/5" : ""}`}
            >
              <div className="flex items-center justify-center">
                <RankBadge rank={p.rank} />
              </div>

              <div className="flex items-center gap-2 min-w-0">
                {p.avatarUrl ? (
                  <img src={p.avatarUrl} alt={p.nickname} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex-shrink-0" />
                ) : (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                    {p.nickname.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-foreground truncate">{p.nickname}</p>
                  <p className="text-[10px] text-muted-foreground">Round {p.currentRound}</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-1">
                <Target className="w-3 h-3 text-accent" />
                <span className="text-xs sm:text-sm font-semibold text-foreground">{p.totalScore}</span>
              </div>

              <div className="hidden sm:flex items-center justify-end gap-1">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {p.averageTime != null ? `${p.averageTime.toFixed(1)}s` : "—"}
                </span>
              </div>

              <div className="flex justify-end">
                {isComplete ? (
                  <span className={`text-[10px] sm:text-xs font-medium ${
                    p.prizeWon > 0 ? "text-yellow-400" : "text-muted-foreground"
                  }`}>
                    {p.prizeWon > 0 ? `${p.prizeWon.toLocaleString()} MP` : "—"}
                  </span>
                ) : (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                    p.status === "active" || p.status === "winner"
                      ? "bg-green-500/20 text-green-400"
                      : "bg-red-500/20 text-red-400"
                  }`}>
                    {p.status}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TournamentLeaderboardView;
