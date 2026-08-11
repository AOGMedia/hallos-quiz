import { ChevronLeft, Trophy, Zap, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMyTournaments } from "@/hooks/useTournament";
import { FORMAT_COLORS, FORMAT_LABELS } from "@/lib/api/tournament";

interface TournamentHistoryProps {
  onBack: () => void;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();
}

function resultLabel(placement: number | null, status: string): string {
  if (placement === 1) return "🏆 1st place";
  if (placement === 2) return "🥈 2nd place";
  if (placement === 3) return "🥉 3rd place";
  if (status === "eliminated") return "Eliminated";
  if (status === "active" || status === "registered") return "In progress";
  return placement ? `#${placement}` : "—";
}

const TournamentHistory = ({ onBack }: TournamentHistoryProps) => {
  const { data, isLoading } = useMyTournaments();

  const participations = data?.participations ?? [];
  const completed = participations.filter((p) => p.tournament.status === "completed");
  const wins = completed.filter((p) => p.placement === 1).length;
  const top3 = completed.filter((p) => p.placement != null && p.placement <= 3).length;
  const winRate = completed.length > 0 ? ((top3 / completed.length) * 100).toFixed(1) : "0.0";
  const totalPrizeMoney = participations.reduce((sum, p) => sum + (p.prizeWon || 0), 0);
  const totalEntryFees = participations.reduce((sum, p) => sum + (p.tournament.entryFee || 0), 0);

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-6">
      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
        <Button
          variant="outline"
          size="icon"
          onClick={onBack}
          className="bg-card border-border hover:bg-muted rounded-full w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-foreground">My History</h1>
          <p className="text-xs sm:text-base text-muted-foreground">Overview of your tournament performance and earnings</p>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-card border border-border rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-2 sm:mb-4">
                <span className="text-muted-foreground text-xs sm:text-sm">Top-3 Rate</span>
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-accent/20 flex items-center justify-center">
                  <Trophy className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-accent" />
                </div>
              </div>
              <div className="flex items-baseline gap-2 sm:gap-3">
                <span className="text-2xl sm:text-4xl font-bold text-foreground">{winRate}%</span>
              </div>
              <p className="text-muted-foreground text-xs sm:text-sm mt-1 sm:mt-2">
                {top3} top-3 finishes / {wins} wins in {completed.length} completed tournaments
              </p>
            </div>

            <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-2 sm:mb-4">
                <span className="text-muted-foreground text-xs sm:text-sm">Total MP Earned</span>
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-yellow-500/20 flex items-center justify-center">
                  <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-yellow-400" />
                </div>
              </div>
              <div className="flex items-baseline gap-2 sm:gap-3">
                <span className="text-2xl sm:text-4xl font-bold text-foreground">{totalPrizeMoney.toLocaleString()}</span>
              </div>
              <p className="text-muted-foreground text-xs sm:text-sm mt-1 sm:mt-2">
                Net: {(totalPrizeMoney - totalEntryFees).toLocaleString()} MP across {participations.length} entries
              </p>
            </div>

            <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-2 sm:mb-4">
                <span className="text-muted-foreground text-xs sm:text-sm">Tournaments Played</span>
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-primary/20 flex items-center justify-center">
                  <Gamepad2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary" />
                </div>
              </div>
              <div className="flex items-baseline gap-2 sm:gap-3">
                <span className="text-2xl sm:text-4xl font-bold text-foreground">{participations.length}</span>
              </div>
              <p className="text-muted-foreground text-xs sm:text-sm mt-1 sm:mt-2">
                {data?.proposals.length ?? 0} tournaments you've proposed
              </p>
            </div>
          </div>

          {/* Recent Activities Table */}
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="p-3 sm:p-4 border-b border-border">
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Recent Activities</h3>
            </div>

            {participations.length === 0 ? (
              <div className="p-6 sm:p-8 text-center text-sm text-muted-foreground">
                You haven't entered any tournaments yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground text-[10px] sm:text-xs uppercase tracking-wider">
                      <th className="text-left p-2 sm:p-4">Date</th>
                      <th className="text-left p-2 sm:p-4">Tournament Name</th>
                      <th className="text-left p-2 sm:p-4">Format</th>
                      <th className="text-left p-2 sm:p-4">Entry</th>
                      <th className="text-left p-2 sm:p-4">Result</th>
                      <th className="text-right p-2 sm:p-4">MP Won/Lost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {participations.map((p) => {
                      const netMp = (p.prizeWon || 0) - (p.tournament.entryFee || 0);
                      return (
                        <tr key={p.tournamentId} className="border-b border-border last:border-b-0 hover:bg-muted/50">
                          <td className="p-2 sm:p-4 text-muted-foreground text-xs sm:text-base whitespace-nowrap">
                            {fmtDate(p.registeredAt)}
                          </td>
                          <td className="p-2 sm:p-4">
                            <span className="font-medium text-foreground text-xs sm:text-base">{p.tournament.name}</span>
                          </td>
                          <td className="p-2 sm:p-4">
                            <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium rounded whitespace-nowrap ${FORMAT_COLORS[p.tournament.format]}`}>
                              {FORMAT_LABELS[p.tournament.format]}
                            </span>
                          </td>
                          <td className="p-2 sm:p-4 text-foreground text-xs sm:text-base whitespace-nowrap">
                            {p.tournament.entryFee} MP
                          </td>
                          <td className="p-2 sm:p-4">
                            <span className={`text-xs sm:text-base whitespace-nowrap ${p.placement && p.placement <= 3 ? "text-accent" : "text-foreground"}`}>
                              {resultLabel(p.placement, p.status)}
                            </span>
                          </td>
                          <td className="p-2 sm:p-4 text-right">
                            <span className={`text-xs sm:text-base whitespace-nowrap ${netMp >= 0 ? "text-green-400" : "text-red-400"}`}>
                              {netMp >= 0 ? "+" : ""}{netMp} MP
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default TournamentHistory;
