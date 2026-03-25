import type { QuizProfile } from "@/lib/api/quizProfile";
import { Zap, Trophy, Target, Swords } from "lucide-react";

interface ProfileStatsCardProps {
  profile: QuizProfile;
}

const StatItem = ({ label, value }: { label: string; value: string | number }) => (
  <div className="bg-card border border-border rounded-xl p-3 sm:p-4">
    <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
    <p className="text-lg sm:text-2xl font-bold text-foreground">{value}</p>
  </div>
);

const ProfileStatsCard = ({ profile }: ProfileStatsCardProps) => {
  const { lobbyStats, tournamentStats, overallStats } = profile;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Lobby stats */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Swords className="w-4 h-4 text-primary" />
          <h3 className="text-xs sm:text-sm font-semibold text-foreground uppercase tracking-wider">
            Lobby Stats
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <StatItem label="Matches" value={lobbyStats.totalMatches} />
          <StatItem label="Wins" value={lobbyStats.wins} />
          <StatItem label="Losses" value={lobbyStats.losses} />
          <StatItem label="Win Rate" value={`${lobbyStats.winRate.toFixed(1)}%`} />
        </div>
      </div>

      {/* Tournament stats */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="w-4 h-4 text-yellow-400" />
          <h3 className="text-xs sm:text-sm font-semibold text-foreground uppercase tracking-wider">
            Tournament Stats
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <StatItem label="Entered" value={tournamentStats.tournamentsEntered} />
          <StatItem label="Won" value={tournamentStats.tournamentsWon} />
          <StatItem label="Top 3" value={tournamentStats.top3Finishes} />
          <StatItem label="Prize CP" value={tournamentStats.totalPrizeMoney.toLocaleString()} />
        </div>
      </div>

      {/* Overall accuracy */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4 text-accent" />
          <h3 className="text-xs sm:text-sm font-semibold text-foreground uppercase tracking-wider">
            Accuracy
          </h3>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <StatItem label="Questions" value={overallStats.totalQuestions} />
          <StatItem label="Correct" value={overallStats.correctAnswers} />
          <StatItem label="Accuracy" value={`${overallStats.accuracy.toFixed(1)}%`} />
        </div>
      </div>

      {/* Winnings */}
      <div className="flex items-center justify-between p-3 sm:p-4 bg-card border border-border rounded-xl">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-warning" />
          <span className="text-xs sm:text-sm text-muted-foreground">Total Winnings</span>
        </div>
        <span className="text-sm sm:text-base font-bold text-foreground">
          {lobbyStats.totalWinnings.toLocaleString()} CP
        </span>
      </div>
    </div>
  );
};

export default ProfileStatsCard;
