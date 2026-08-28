import { useEffect } from "react";
import { ChevronLeft, Zap, Users, Clock, Trophy, AlertCircle, CheckCircle2, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import FormatBadge from "./FormatBadge";
import { useTournamentDetail, useRegisterTournament, useUnregisterTournament } from "@/hooks/useTournament";
import { useTournamentStore } from "@/store/tournamentStore";
import { FORMAT_LABELS } from "@/lib/api/tournament";
import { joinTournament } from "@/lib/socket/tournamentEmitters";
import { formatMPWithUnit, toAmount } from "@/lib/helpers/formatMP";

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
  const { data, isLoading, isError, error, refetch } = useTournamentDetail(tournamentId);
  const registerMutation   = useRegisterTournament(tournamentId);
  const unregisterMutation = useUnregisterTournament(tournamentId);
  const registered = useTournamentStore((s) => s.isRegistered(tournamentId));

  const t = data?.tournament;

  // The server is the source of truth for "am I registered" — the Zustand flag
  // is only a local optimistic marker and is empty after a reload, which made a
  // registered user see the Register button again. Can't be derived from
  // `participants`, which the server blanks for privacy until the tournament starts.
  const isRegistered = data?.isRegistered === true || registered;

  // Join the tournament's socket room so round_started/round_ended broadcasts
  // (shared-question formats) and the live leaderboard reach us while an
  // in-progress tournament is on screen. Also remembered for auto-rejoin on
  // reconnect — see socket.ts.
  useEffect(() => {
    if (!t || t.status !== "in_progress") return;
    sessionStorage.setItem("currentTournamentId", t.id);
    joinTournament(t.id);
  }, [t]);

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

      {/* Without this the whole screen rendered blank on any fetch failure —
          there was no branch for `isError`, and `t` is undefined in that case. */}
      {isError && (
        <div className="max-w-2xl bg-card border border-border rounded-xl p-6 text-center">
          <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-3" />
          <p className="text-sm font-semibold text-foreground mb-1">Couldn&apos;t load this tournament</p>
          <p className="text-xs text-muted-foreground mb-4">
            {(error as Error)?.message ?? "Something went wrong."}
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => refetch()} className="bg-accent hover:bg-accent/90 text-accent-foreground text-sm">
              Try again
            </Button>
            <Button onClick={onBack} variant="outline" className="border-border text-sm">
              Back
            </Button>
          </div>
        </div>
      )}

      {/* Query resolved but returned nothing renderable — also previously blank. */}
      {!isLoading && !isError && !t && (
        <div className="max-w-2xl bg-card border border-border rounded-xl p-6 text-center">
          <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-semibold text-foreground mb-1">Tournament not found</p>
          <p className="text-xs text-muted-foreground mb-4">
            It may have been cancelled or is no longer available.
          </p>
          <Button onClick={onBack} variant="outline" className="border-border text-sm">
            Back to tournaments
          </Button>
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
                { label: "Entry Fee",   value: formatMPWithUnit(t.entryFee),   icon: Zap,      color: "text-warning" },
                // The pool is a running total of collected entry fees, not a
                // fixed advertised prize — with one entrant it legitimately
                // equals the entry fee, which reads like a bug without this label.
                { label: "Pool so far", value: formatMPWithUnit(t.prizePool),  icon: Trophy,   color: "text-yellow-400" },
                { label: "Players",     value: t.maxParticipants ? `${data.participantCount}/${t.maxParticipants}` : `${data.participantCount}`, icon: Users, color: "text-primary" },
                {
                  label: t.status === "in_progress" ? "Progress" : "Rounds",
                  // totalRounds is null until the tournament starts — for
                  // knockout/battle_royale it's derived from the final entrant
                  // count, so it genuinely can't be known in advance. It used
                  // to render literally as "null rounds".
                  value: t.status === "in_progress"
                    ? `Round ${t.currentRound || 1}/${t.totalRounds ?? "?"}`
                    : t.totalRounds != null
                      ? `${t.totalRounds} rounds`
                      : "TBD",
                  icon: BarChart2,
                  color: "text-accent",
                },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="bg-secondary rounded-xl p-3 text-center">
                  <Icon className={`w-4 h-4 mx-auto mb-1 ${color}`} />
                  <p className="text-xs sm:text-sm font-bold text-foreground">{value}</p>
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>

            {t.status === "open" && toAmount(t.entryFee) > 0 && (
              <p className="text-[11px] text-muted-foreground mt-3 text-center">
                The pool grows by {formatMPWithUnit(t.entryFee)} per entrant
                {t.maxParticipants
                  ? ` — up to ${formatMPWithUnit(toAmount(t.entryFee) * t.maxParticipants)} if it fills.`
                  : "."}
                {t.totalRounds == null && " Rounds are set when the tournament starts."}
              </p>
            )}
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
                    {formatMPWithUnit(Math.round(toAmount(t.prizePool) * pct / 100))}
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
            {/* The lifecycle sweep cancels and refunds under-filled tournaments,
                so entrants need to see the threshold they're betting on. */}
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="text-muted-foreground">Minimum players</span>
              <span className="text-foreground font-medium">
                {t.minParticipants}
                {t.status === "open" && data.participantCount < t.minParticipants && (
                  <span className="text-warning ml-1.5">
                    ({t.minParticipants - data.participantCount} more needed)
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Entrants — hidden by the server until the tournament starts */}
          <div className="bg-card border border-border rounded-xl p-4 sm:p-5">
            <h3 className="text-xs sm:text-sm font-semibold text-foreground uppercase tracking-wider mb-3">
              Entrants ({data.participantCount})
            </h3>
            {data.participantsHidden ? (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 flex-shrink-0" />
                The entrant list stays private until the tournament starts.
              </p>
            ) : t.participants.length === 0 ? (
              <p className="text-xs text-muted-foreground">No one has registered yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {t.participants.map((p) => (
                  <div
                    key={p.userId}
                    className="flex items-center gap-2 bg-secondary rounded-lg pl-1.5 pr-2.5 py-1.5"
                  >
                    {p.avatarUrl ? (
                      <img src={p.avatarUrl} alt="" className="w-6 h-6 rounded-full flex-shrink-0" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0">
                        {(p.nickname ?? "?").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-xs text-foreground">{p.nickname ?? `Player ${p.userId}`}</span>
                    {p.status === "eliminated" && (
                      <span className="text-[10px] text-destructive">out</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Persistent registered state — the mutation success flags below are
              transient and disappear on reload/refetch, which made a registered
              user see no confirmation at all after coming back to this screen. */}
          {t.status === "open" && isRegistered && !unregisterMutation.isSuccess && (
            <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl text-xs sm:text-sm">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              You&apos;re registered for this tournament. It starts {fmt(t.startTime)}.
            </div>
          )}

          {/* Feedback */}
          {(registerMutation.isSuccess || unregisterMutation.isSuccess) && (
            <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl text-xs sm:text-sm">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              {registerMutation.isSuccess
                ? `Registered! ${formatMPWithUnit(t.entryFee)} deducted.`
                : `Unregistered. ${formatMPWithUnit(t.entryFee)} refunded.`}
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

            {t.status === "open" && !isRegistered && (
              <Button
                onClick={handleRegister}
                disabled={
                  registerMutation.isPending ||
                  (t.maxParticipants != null && data.participantCount >= t.maxParticipants)
                }
                className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground text-sm disabled:opacity-40"
              >
                {registerMutation.isPending ? "Registering…" : `Register · ${formatMPWithUnit(t.entryFee)}`}
              </Button>
            )}

            {t.status === "open" && isRegistered && (
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
