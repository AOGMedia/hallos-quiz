import { useEffect, useMemo, useState } from "react";
import { addMinutes } from "date-fns";
import { ChevronLeft, Info, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateTimeField } from "@/components/ui/date-time-field";
import { useCategories } from "@/hooks/useChallenge";
import { useProposeTournament } from "@/hooks/useTournament";
import { FORMAT_LABELS, type TournamentFormat } from "@/lib/api/tournament";

interface HostTournamentProps {
  onBack: () => void;
}

const FORMATS: TournamentFormat[] = ["classic", "speed_run", "knockout", "battle_royale"];

const ENTRY_FEE_PRESETS = [0, 50, 100, 250, 500];

// Knockout/battle_royale round counts are derived from the final registered
// headcount when the tournament starts — not a free choice, so there's no
// input for them here. classic/speed_run have no elimination mechanic to
// derive a count from, so — same as entry fee, player caps, and prize split
// — the organizer sets it directly. Bounds/default must match
// tournamentService.js's MIN/MAX/DEFAULT_TOURNAMENT_ROUNDS on the backend.
const CONFIGURABLE_ROUNDS_FORMATS: TournamentFormat[] = ["classic", "speed_run"];
const DEFAULT_ROUNDS = 3;
const MIN_ROUNDS = 1;
const MAX_ROUNDS = 10;

interface NumberFieldProps {
  id: string;
  label: string;
  value: number;
  onCommit: (n: number) => void;
  min: number;
  max?: number;
  suffix?: string;
  hint?: string;
}

/**
 * Numeric input that clamps on blur rather than on every keystroke.
 * Clamping per-keystroke made these unusable: with a floor of 2, typing "50"
 * turned the leading "5"… into whatever survived the clamp, and clearing the
 * field to retype was impossible because "" immediately snapped back.
 */
const NumberField = ({ id, label, value, onCommit, min, max, suffix, hint }: NumberFieldProps) => {
  const [draft, setDraft] = useState(String(value));
  const [focused, setFocused] = useState(false);

  // Follow external changes (e.g. max being pushed up by min) while idle
  useEffect(() => {
    if (!focused) setDraft(String(value));
  }, [value, focused]);

  const commit = () => {
    setFocused(false);
    const parsed = Number(draft);
    if (draft.trim() === "" || Number.isNaN(parsed)) {
      setDraft(String(value));
      return;
    }
    let next = Math.floor(parsed);
    if (next < min) next = min;
    if (max != null && next > max) next = max;
    setDraft(String(next));
    onCommit(next);
  };

  return (
    <div>
      <label htmlFor={id} className="block text-xs sm:text-sm text-foreground mb-1.5 sm:mb-2">
        {label}
      </label>
      <div className="relative">
        <Input
          id={id}
          type="text"
          inputMode="numeric"
          value={draft}
          onFocus={() => setFocused(true)}
          onChange={(e) => setDraft(e.target.value.replace(/[^\d]/g, ""))}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
          className={`bg-background border-border text-foreground text-sm sm:text-base ${suffix ? "pr-11" : ""}`}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
};

const HostTournament = ({ onBack }: HostTournamentProps) => {
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories();
  const { mutate: propose, isPending, isSuccess, isError, error, reset } = useProposeTournament();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [format, setFormat] = useState<TournamentFormat>("classic");
  const [categoryId, setCategoryId] = useState("");
  const [entryFee, setEntryFee] = useState(100);
  const [minParticipants, setMinParticipants] = useState(4);
  const [maxParticipants, setMaxParticipants] = useState(50);
  const [totalRounds, setTotalRounds] = useState(DEFAULT_ROUNDS);
  const [registrationDeadline, setRegistrationDeadline] = useState<Date | undefined>();
  const [startTime, setStartTime] = useState<Date | undefined>();
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  const categories = categoriesData?.categories ?? [];

  // Registration must close at least this far out, so there's a real window to
  // register in rather than a deadline the proposer has already missed.
  const earliestDeadline = useMemo(() => addMinutes(new Date(), 30), []);

  /** Start must be after registration closes; that's the only ordering rule. */
  const earliestStart = registrationDeadline
    ? addMinutes(registrationDeadline, 15)
    : earliestDeadline;

  const deadlineError =
    hasAttemptedSubmit && !registrationDeadline
      ? "Set when registration closes"
      : registrationDeadline && registrationDeadline <= new Date()
        ? "Must be in the future"
        : null;

  const startError =
    hasAttemptedSubmit && !startTime
      ? "Set when the tournament starts"
      : startTime && registrationDeadline && startTime <= registrationDeadline
        ? "Must be after registration closes"
        : null;

  const validationError = (() => {
    if (!name.trim()) return "Give your tournament a name";
    if (!categoryId) return "Pick a category";
    if (entryFee < 0) return "Entry fee can't be negative";
    if (minParticipants < 2) return "Need at least 2 minimum participants";
    if (maxParticipants < minParticipants) return "Max participants can't be less than the minimum";
    if (!registrationDeadline) return "Set when registration closes";
    if (!startTime) return "Set when the tournament starts";
    if (registrationDeadline <= new Date()) return "Registration must close in the future";
    if (startTime <= registrationDeadline) return "Start time must be after registration closes";
    return null;
  })();

  const handleSubmit = () => {
    setHasAttemptedSubmit(true);
    if (validationError) return;
    reset();
    propose({
      name: name.trim(),
      description: description.trim() || undefined,
      format,
      entryFee,
      categoryId,
      minParticipants,
      maxParticipants,
      registrationDeadline: registrationDeadline!.toISOString(),
      startTime: startTime!.toISOString(),
      // Ignored by the backend for knockout/battle_royale (their round count
      // is computed from the final headcount at start time), so it's fine to
      // always send the current value regardless of format.
      totalRounds,
    });
  };

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
          <h1 className="text-lg sm:text-2xl font-bold text-foreground">Host a Tournament</h1>
          <p className="text-xs sm:text-base text-muted-foreground">Propose an event — an admin reviews it before it goes live</p>
        </div>
      </div>

      <div className="max-w-xl bg-card rounded-xl border border-border p-4 sm:p-6 space-y-4 sm:space-y-5">
        <div>
          <label className="block text-xs sm:text-sm text-foreground mb-1.5 sm:mb-2">Tournament title</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Annual JAMB Mock 2026"
            className="bg-background border-border text-foreground placeholder:text-muted-foreground text-sm sm:text-base"
          />
        </div>

        <div>
          <label className="block text-xs sm:text-sm text-foreground mb-1.5 sm:mb-2">Description (optional)</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What should players expect?"
            className="bg-background border-border text-foreground placeholder:text-muted-foreground text-sm sm:text-base"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm text-foreground mb-1.5 sm:mb-2">Format</label>
            <Select value={format} onValueChange={(v) => setFormat(v as TournamentFormat)}>
              <SelectTrigger className="bg-background border-border text-sm sm:text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORMATS.map((f) => (
                  <SelectItem key={f} value={f}>{FORMAT_LABELS[f]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm text-foreground mb-1.5 sm:mb-2">Category</label>
            <Select value={categoryId} onValueChange={setCategoryId} disabled={categoriesLoading}>
              <SelectTrigger className="bg-background border-border text-sm sm:text-base">
                <SelectValue placeholder={categoriesLoading ? "Loading…" : "Choose a category"} />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            <NumberField
              id="entry-fee"
              label="Entry fee"
              value={entryFee}
              onCommit={setEntryFee}
              min={0}
              suffix="MP"
              hint={entryFee === 0 ? "Free to enter" : `Pot fills to ${(entryFee * minParticipants).toLocaleString()} MP at minimum`}
            />
            <NumberField
              id="min-players"
              label="Min players"
              value={minParticipants}
              onCommit={(n) => {
                setMinParticipants(n);
                // Max must stay at or above min, or the tournament can never fill.
                if (n > maxParticipants) setMaxParticipants(n);
              }}
              min={2}
              hint="Refunded below this"
            />
            <NumberField
              id="max-players"
              label="Max players"
              value={maxParticipants}
              onCommit={setMaxParticipants}
              min={minParticipants}
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
            <span className="text-[11px] text-muted-foreground mr-0.5">Entry fee:</span>
            {ENTRY_FEE_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setEntryFee(preset)}
                className={`px-2 py-1 text-[11px] rounded-md transition-colors ${
                  entryFee === preset
                    ? "bg-accent text-accent-foreground font-medium"
                    : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {preset === 0 ? "Free" : `${preset} MP`}
              </button>
            ))}
          </div>
        </div>

        {CONFIGURABLE_ROUNDS_FORMATS.includes(format) && (
          <div className="max-w-[12rem]">
            <NumberField
              id="total-rounds"
              label="Rounds"
              value={totalRounds}
              onCommit={setTotalRounds}
              min={MIN_ROUNDS}
              max={MAX_ROUNDS}
              hint={
                totalRounds === 1
                  ? "One round decides the whole tournament"
                  : `Score accumulates across all ${totalRounds} rounds — consistency wins, not one lucky round`
              }
            />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label htmlFor="registration-closes" className="block text-xs sm:text-sm text-foreground mb-1.5 sm:mb-2">
              Registration closes
            </label>
            <DateTimeField
              id="registration-closes"
              value={registrationDeadline}
              onChange={(d) => {
                setRegistrationDeadline(d);
                // Keep the pair coherent — a start that's now earlier than the
                // new deadline is cleared rather than left silently invalid.
                if (d && startTime && startTime <= d) setStartTime(undefined);
              }}
              min={earliestDeadline}
              placeholder="Pick a closing time"
              error={deadlineError}
            />
          </div>
          <div>
            <label htmlFor="tournament-starts" className="block text-xs sm:text-sm text-foreground mb-1.5 sm:mb-2">
              Tournament starts
            </label>
            <DateTimeField
              id="tournament-starts"
              value={startTime}
              onChange={setStartTime}
              min={earliestStart}
              placeholder={registrationDeadline ? "Pick a start time" : "Set the closing time first"}
              error={startError}
            />
          </div>
        </div>

        {/* Review Process Info */}
        <div className="bg-accent/10 border border-accent/30 rounded-lg p-3 sm:p-4">
          <div className="flex gap-2 sm:gap-3">
            <Info className="w-4 h-4 sm:w-5 sm:h-5 text-accent flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-foreground font-medium mb-0.5 sm:mb-1 text-sm sm:text-base">Review Process</h4>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Your tournament goes to an admin for review before it's open for registration.
                Questions are drawn from the category's existing question bank — no upload needed.
                Prizes split 60/30/10 across the top 3 finishers by default.
              </p>
            </div>
          </div>
        </div>

        {isSuccess && (
          <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl text-xs sm:text-sm">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            Proposal submitted! You'll be notified once an admin reviews it.
          </div>
        )}
        {(isError || (hasAttemptedSubmit && validationError)) && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs sm:text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {isError ? (error as Error)?.message : validationError}
          </div>
        )}

        <Button
          onClick={handleSubmit}
          disabled={isPending}
          className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-sm sm:text-base disabled:opacity-50"
        >
          {isPending ? "Submitting…" : "Submit for Review"}
        </Button>
      </div>
    </div>
  );
};

export default HostTournament;
