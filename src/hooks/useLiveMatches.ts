import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getLiveMatches, type LiveMatch, type LiveMatchResult } from "@/lib/api/lobby";
import {
  onLiveMatchStartedScoped,
  onLiveMatchProgressScoped,
  onLiveMatchEndedScoped,
  onLiveMatchResultScoped,
} from "@/lib/socket/events";

export const LIVE_MATCH_KEYS = {
  list: ["lobby", "liveMatches"] as const,
};

/** Mirrors the server's own cap so a burst of results can't grow this without bound. */
const MAX_RESULTS = 20;

/**
 * The public "Live Now" feed — matches being played right now, plus recently
 * finished ones so the section still has something real to show when nothing
 * is in play.
 *
 * REST gives content on first paint and re-syncs periodically, so a missed
 * socket event can't leave the feed permanently wrong; socket broadcasts patch
 * local state between fetches for the live, ticking feel. Local state rather
 * than the query cache, because progress updates arrive several times per
 * second while matches run — a cache write per answer would re-render every
 * consumer of the query.
 */
export function useLiveMatches() {
  const { data, isLoading } = useQuery({
    queryKey: LIVE_MATCH_KEYS.list,
    queryFn: getLiveMatches,
    staleTime: 15_000,
    refetchInterval: 60_000,
  });

  const [matches, setMatches] = useState<LiveMatch[]>([]);
  const [results, setResults] = useState<LiveMatchResult[]>([]);

  // Adopt each REST snapshot as the new baseline.
  useEffect(() => {
    if (data?.matches) setMatches(data.matches);
    if (data?.recentResults) setResults(data.recentResults.slice(0, MAX_RESULTS));
  }, [data]);

  useEffect(() => {
    const unsubStarted = onLiveMatchStartedScoped((card) => {
      setMatches((prev) =>
        prev.some((m) => m.matchId === card.matchId) ? prev : [card, ...prev]
      );
    });

    const unsubProgress = onLiveMatchProgressScoped((update) => {
      setMatches((prev) =>
        prev.map((m) =>
          m.matchId === update.matchId
            ? {
                ...m,
                players: update.players,
                totalQuestions: update.totalQuestions ?? m.totalQuestions,
                updatedAt: Date.now(),
              }
            : m
        )
      );
    });

    const unsubEnded = onLiveMatchEndedScoped(({ matchId }) => {
      setMatches((prev) => prev.filter((m) => m.matchId !== matchId));
    });

    const unsubResult = onLiveMatchResultScoped((result) => {
      setResults((prev) => {
        if (prev.some((r) => r.matchId === result.matchId)) return prev;
        return [result, ...prev].slice(0, MAX_RESULTS);
      });
    });

    return () => {
      unsubStarted();
      unsubProgress();
      unsubEnded();
      unsubResult();
    };
  }, []);

  return { matches, results, isLoading };
}
