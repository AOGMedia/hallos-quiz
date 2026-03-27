import { useState } from "react";
import { Swords, RefreshCw, Loader2 } from "lucide-react";
import ChallengeCard from "./ChallengeCard";
import { useChallenges, useAcceptChallenge } from "@/hooks/useChallenge";
import type { Challenge } from "@/lib/api/lobby";
import { useQueryClient } from "@tanstack/react-query";

const WAGER_FILTERS = ["All", "≤100 CP", "101–300 CP", "300+ CP"] as const;
type WagerFilter = (typeof WAGER_FILTERS)[number];

function filterByWager(challenges: Challenge[], filter: WagerFilter): Challenge[] {
  switch (filter) {
    case "≤100 CP": return challenges.filter((c) => c.wagerAmount <= 100);
    case "101–300 CP": return challenges.filter((c) => c.wagerAmount > 100 && c.wagerAmount <= 300);
    case "300+ CP": return challenges.filter((c) => c.wagerAmount > 300);
    default: return challenges;
  }
}

interface ChallengeBoardTabProps {
  onAccept: (challengeId: string, matchId: string) => void;
}

const ChallengeBoardTab = ({ onAccept }: ChallengeBoardTabProps) => {
  const [activeFilter, setActiveFilter] = useState<WagerFilter>("All");
  const qc = useQueryClient();

  const { data, isLoading, isError } = useChallenges({ status: "pending" });
  const { mutate: accept, isPending: isAccepting } = useAcceptChallenge();

  const challenges = data?.challenges ?? [];
  const filtered = filterByWager(challenges, activeFilter);

  const handleAccept = (challengeId: string) => {
    accept(challengeId, {
      onSuccess: (res) => {
        if (res.success) {
          onAccept(challengeId, res.matchId);
        }
      },
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Swords className="w-4 h-4 text-primary" />
          <h2 className="text-sm sm:text-base font-semibold text-foreground">Open Challenges</h2>
          {!isLoading && (
            <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] sm:text-xs font-semibold">
              {challenges.length}
            </span>
          )}
        </div>
        <button
          onClick={() => qc.invalidateQueries({ queryKey: ["lobby", "challenges"] })}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Wager filter tabs */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
        {WAGER_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              activeFilter === f
                ? "bg-primary border-primary text-primary-foreground"
                : "bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* States */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm text-destructive">Failed to load challenges</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Swords className="w-10 h-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">No open challenges in this range</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Try a different filter or check back soon</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((challenge) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              onAccept={handleAccept}
              isAccepting={isAccepting}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ChallengeBoardTab;
