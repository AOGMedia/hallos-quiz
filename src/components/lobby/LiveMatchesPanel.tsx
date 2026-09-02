import { useState } from "react";
import { Radio, Trophy, Swords, User } from "lucide-react";
import { useLiveMatches } from "@/hooks/useLiveMatches";
import RecentResultsTicker from "./RecentResultsTicker";
import type { LiveMatch, LiveMatchPlayer } from "@/lib/api/lobby";

const PlayerAvatar = ({ player }: { player: LiveMatchPlayer }) => {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="w-9 h-9 rounded-full border-2 border-border bg-secondary flex-shrink-0 overflow-hidden flex items-center justify-center">
      {!imgError && player.avatarUrl ? (
        <img
          src={player.avatarUrl}
          alt={player.nickname}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <User className="w-4 h-4 text-muted-foreground" />
      )}
    </div>
  );
};

const LiveMatchCard = ({ match }: { match: LiveMatch }) => {
  const [p1, p2] = match.players;
  if (!p1 || !p2) return null;

  const isTournament = match.matchType === "tournament";
  // Progress is the further along of the two — it reads as "how far through
  // the match are we", not "how far is this particular player".
  const answered = Math.max(p1.answered, p2.answered);
  const total = match.totalQuestions;
  const leader = p1.score === p2.score ? null : p1.score > p2.score ? p1.userId : p2.userId;

  return (
    <div className="bg-background border border-border rounded-xl p-3">
      <div className="flex items-center gap-1.5 mb-2.5">
        {isTournament ? (
          <Trophy className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
        ) : (
          <Swords className="w-3.5 h-3.5 text-accent flex-shrink-0" />
        )}
        <span className="text-[11px] font-medium text-muted-foreground truncate">
          {isTournament
            ? `${match.tournamentName ?? "Tournament"}${match.roundNumber ? ` · Round ${match.roundNumber}` : ""}`
            : "1v1 Challenge"}
        </span>
        {total != null && (
          <span className="ml-auto text-[11px] text-muted-foreground flex-shrink-0">
            Q{Math.min(answered + 1, total)}/{total}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {[p1, p2].map((player, i) => (
          <div key={player.userId} className="flex items-center gap-2 flex-1 min-w-0">
            {i === 1 && (
              <span className="text-[11px] font-semibold text-muted-foreground flex-shrink-0">vs</span>
            )}
            <PlayerAvatar player={player} />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-foreground truncate">{player.nickname}</div>
              <div
                className={`text-sm font-bold ${
                  leader === player.userId ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {player.score}
              </div>
            </div>
          </div>
        ))}
      </div>

      {total != null && total > 0 && (
        <div className="mt-2.5 h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${Math.min(Math.round((answered / total) * 100), 100)}%` }}
          />
        </div>
      )}
    </div>
  );
};

/**
 * "Live Now" — a public window onto matches being played right now, so the
 * lobby feels inhabited instead of empty. Renders nothing when nothing is in
 * play, rather than showing a dead placeholder.
 */
const LiveMatchesPanel = () => {
  const { matches, results } = useLiveMatches();

  const hasLive = matches.length > 0;
  const hasResults = results.length > 0;

  // Nothing live and nothing recent means there is genuinely no activity to
  // show, so render nothing rather than an empty shell.
  if (!hasLive && !hasResults) return null;

  return (
    <section className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        {hasLive ? (
          <>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
            </span>
            <h2 className="text-sm font-semibold text-foreground">Live Now</h2>
            <span className="text-xs text-muted-foreground">
              {matches.length} {matches.length === 1 ? "match" : "matches"} in play
            </span>
          </>
        ) : (
          <h2 className="text-sm font-semibold text-foreground">Just Finished</h2>
        )}
        <Radio className="w-3.5 h-3.5 text-muted-foreground ml-auto" />
      </div>

      {hasLive && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {matches.slice(0, 6).map((match) => (
            <LiveMatchCard key={match.matchId} match={match} />
          ))}
        </div>
      )}

      {hasResults && (
        <div className={hasLive ? "mt-3 pt-3 border-t border-border" : ""}>
          <RecentResultsTicker results={results} />
        </div>
      )}
    </section>
  );
};

export default LiveMatchesPanel;
