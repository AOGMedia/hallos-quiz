import { ChevronLeft, Zap, Users, Clock, Trophy, AlertCircle, CheckCircle2, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import FormatBadge from "./FormatBadge";
import { useTournamentDetail, useRegisterTournament, useUnregisterTournament } from "@/hooks/useTournament";
import { useTournamentStore } from "@/store/tournamentStore";
import { FORMAT_LABELS } from "@/lib/api/tournament";

interface TournamentDetailViewProps {
  tournamentId: string;
  onBack: () => void;
  onViewLeaderboard: (id: string) => void;
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const TournamentDetailView = ({ tournamentId, onBack, onViewLeaderboard }: TournamentDetailViewProps) => {
  const { data, isLoading } = useTournamentDetail(tournamentId);
  const registerMutation   = useRegisterTournament(tournamentId);
  const unregisterMutation = useUnregisterTournament(tournamentId);
  const registered = useTournamentStore((s) => s.isRegistered(tournamentId));

  const t = data?.tournament;

  const handleRegister = () => {
    registerMutation.mutate(undefined);
  };

  const handleUnregister = () => {
    unregisterMutation.mutate(undefined);
  };

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-6">
      {/* Back */}
      <div className="flex items-center gap-3 mb-5 sm:mb-6">
        <Button variant="outline" size="icon" onClick={onBack}
          className="bg-card border-border hover:bg-muted rounded-full w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </Button>
        <div>
          <h1 className="text-base sm:text-xl font-bold text-foreground">Tournament Details</h1>
          <p className="text-xs text-muted-foreground">Review before registering</p>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="h-20 bg-card border border-border rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {t && (
        <div className="space-y-4 sm:space-y-5 max-w-2xl">
          {/* Hero card */}
          <div className="bg-card border border-border rounded-2xl p-4 sm:p-6">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h2 className="text-lg sm:text-2xl font-bold text-foreground mb-1">{t.name}</h2>
                <p className="text-xs sm:text-sm text-muted-foreground">{t.description}</p>
              </div>
              <FormatBadge format={t.format} />
            </div>

            {/* Key stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-4">
              {[
                { label: "Entry Fee",   value: `${t.entryFee} MP`,              icon: Zap,      color: "text-warning" },
                { label: "Prize Pool",  value: `${t.prizePool.toLocaleString()} MP`, icon: Trophy, color: "text-yellow-400" },
                { label: "Players",     value: `${data.participantCount}/${t.maxParticipants}`, icon: Users, color: "text-primary" },
                { label: "Rounds",      value: `${t.totalRounds} rounds`,        icon: BarChart2, color: "text-accent" },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="bg-secondary rounded-xl p-3 text-center">
                  <Icon className={`w-4 h-4 mx-auto mb-1 ${color}`} />
                  <p className="text-xs sm:text-sm font-bold text-foreground">{value}</p>
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Prize distribution */}
          <div className="bg-card border border-border rounded-xl p-4 sm:p-5">
            <h3 className="text-xs sm:text-sm font-semibold text-foreground uppercase tracking-wider mb-3">
              Prize Distribution
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                { place: "🥇 1st", pct: t.prizeDistribution.first },
                { place: "🥈 2nd", pct: t.prizeDistribution.second },
                { place: "🥉 3rd", pct: t.prizeDistribution.third },
              ].map(({ place, pct }) => (
                <div key={place} className="bg-secondary rounded-xl p-3 text-center">
                  <p className="text-xs sm:text-sm font-bold text-foreground">{pct}%</p>
                  <p className="text-[10px] text-muted-foreground">{place}</p>
                  <p className="text-[10px] text-yellow-400">
                    {Math.round(t.prizePool * pct / 100).toLocaleString()} MP
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Schedule */}
          <div className="bg-card border border-border rounded-xl p-4 sm:p-5 space-y-2">
            <h3 className="text-xs sm:text-sm font-semibold text-foreground uppercase tracking-wider mb-3">Schedule</h3>
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="w-3.5 h-3.5" /> Registration closes
              </span>
              <span className="text-foreground font-medium">{fmt(t.registrationDeadline)}</span>
            </div>
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Trophy className="w-3.5 h-3.5" /> Tournament starts
              </span>
              <span className="text-foreground font-medium">{fmt(t.startTime)}</span>
            </div>
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-muted-foreground">Format</span>
              <span className="text-foreground font-medium">{FORMAT_LABELS[t.format]}</span>
            </div>
          </div>

          {/* Feedback */}
          {(registerMutation.isSuccess || unregisterMutation.isSuccess) && (
            <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl text-xs sm:text-sm">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              {registerMutation.isSuccess
                ? `Registered! ${t.entryFee} MP deducted.`
                : `Unregistered. ${t.entryFee} MP refunded.`}
            </div>
          )}
          {(registerMutation.isError || unregisterMutation.isError) && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs sm:text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {((registerMutation.error || unregisterMutation.error) as Error)?.message}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {t.status === "in_progress" && (
              <Button
                onClick={() => onViewLeaderboard(t.id)}
                variant="outline"
                className="flex-1 border-border text-sm"
              >
                <BarChart2 className="w-4 h-4 mr-2" /> Live Standings
              </Button>
            )}

            {t.status === "open" && !registered && (
              <Button
                onClick={handleRegister}
                disabled={registerMutation.isPending || data.participantCount >= t.maxParticipants}
                className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground text-sm disabled:opacity-40"
              >
                {registerMutation.isPending ? "Registering…" : `Register · ${t.entryFee} MP`}
              </Button>
            )}

            {t.status === "open" && registered && (
              <Button
                onClick={handleUnregister}
                disabled={unregisterMutation.isPending}
                variant="outline"
                className="flex-1 border-destructive/50 text-destructive hover:bg-destructive/10 text-sm"
              >
                {unregisterMutation.isPending ? "Unregistering…" : "Unregister (get refund)"}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentDetailView;
