import { useState } from "react";
import { ChevronLeft, Info, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCategories } from "@/hooks/useChallenge";
import { useProposeTournament } from "@/hooks/useTournament";
import { FORMAT_LABELS, type TournamentFormat } from "@/lib/api/tournament";

interface HostTournamentProps {
  onBack: () => void;
}

const FORMATS: TournamentFormat[] = ["classic", "speed_run", "knockout", "battle_royale"];

/** Local datetime-local input value -> ISO string */
function toIso(localValue: string): string {
  return localValue ? new Date(localValue).toISOString() : "";
}

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
  const [registrationDeadline, setRegistrationDeadline] = useState("");
  const [startTime, setStartTime] = useState("");
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  const categories = categoriesData?.categories ?? [];

  const validationError = (() => {
    if (!name.trim()) return "Give your tournament a name";
    if (!categoryId) return "Pick a category";
    if (entryFee < 0) return "Entry fee can't be negative";
    if (minParticipants < 2) return "Need at least 2 minimum participants";
    if (maxParticipants < minParticipants) return "Max participants can't be less than the minimum";
    if (!registrationDeadline) return "Set a registration deadline";
    if (!startTime) return "Set a start time";
    if (new Date(registrationDeadline) <= new Date()) return "Registration deadline must be in the future";
    if (new Date(startTime) <= new Date(registrationDeadline)) return "Start time must be after the registration deadline";
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
      registrationDeadline: toIso(registrationDeadline),
      startTime: toIso(startTime),
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

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm text-foreground mb-1.5 sm:mb-2">Entry fee (MP)</label>
            <Input
              type="number"
              min={0}
              value={entryFee}
              onChange={(e) => setEntryFee(Math.max(0, Number(e.target.value)))}
              className="bg-background border-border text-foreground text-sm sm:text-base"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm text-foreground mb-1.5 sm:mb-2">Min players</label>
            <Input
              type="number"
              min={2}
              value={minParticipants}
              onChange={(e) => setMinParticipants(Math.max(2, Number(e.target.value)))}
              className="bg-background border-border text-foreground text-sm sm:text-base"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm text-foreground mb-1.5 sm:mb-2">Max players</label>
            <Input
              type="number"
              min={minParticipants}
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(Math.max(minParticipants, Number(e.target.value)))}
              className="bg-background border-border text-foreground text-sm sm:text-base"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm text-foreground mb-1.5 sm:mb-2">Registration closes</label>
            <Input
              type="datetime-local"
              value={registrationDeadline}
              onChange={(e) => setRegistrationDeadline(e.target.value)}
              className="bg-background border-border text-foreground text-sm sm:text-base"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm text-foreground mb-1.5 sm:mb-2">Tournament starts</label>
            <Input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="bg-background border-border text-foreground text-sm sm:text-base"
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
