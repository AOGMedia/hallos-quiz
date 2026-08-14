import { useMemo, useState } from "react";
import { format, isSameDay, startOfDay, addDays, setHours, setMinutes } from "date-fns";
import { CalendarIcon, Clock, X } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DateTimeFieldProps {
  value: Date | undefined;
  onChange: (value: Date | undefined) => void;
  /** Earliest selectable moment — days before it are disabled, as are times on that day */
  min?: Date;
  placeholder?: string;
  /** Shown under the field in red; suppresses the relative-time hint */
  error?: string | null;
  className?: string;
  id?: string;
}

const SLOT_MINUTES = 15;

/** 00:00 → 23:45 in 15-minute steps */
function buildSlots(): { hours: number; minutes: number }[] {
  const slots: { hours: number; minutes: number }[] = [];
  for (let m = 0; m < 24 * 60; m += SLOT_MINUTES) {
    slots.push({ hours: Math.floor(m / 60), minutes: m % 60 });
  }
  return slots;
}

/** "in 3 days", "in about 5 hours", "in 20 minutes" — plain and unambiguous */
function relativeHint(target: Date): string {
  const diffMs = target.getTime() - Date.now();
  if (diffMs <= 0) return "in the past";
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 60) return `in ${minutes} minute${minutes === 1 ? "" : "s"}`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `in about ${hours} hour${hours === 1 ? "" : "s"}`;
  return `in ${Math.round(hours / 24)} days`;
}

/**
 * Date + time in one control. Replaces `<input type="datetime-local">`, which
 * renders with the browser's own light-themed calendar widget and a "--:--"
 * placeholder that gives no indication of the expected format — and, more
 * importantly, happily accepts a start time that falls before registration
 * closes. Here the `min` bound disables invalid days *and* invalid time slots,
 * so the impossible combination can't be entered in the first place.
 */
export function DateTimeField({
  value,
  onChange,
  min,
  placeholder = "Pick a date and time",
  error,
  className,
  id,
}: DateTimeFieldProps) {
  const [open, setOpen] = useState(false);
  const slots = useMemo(buildSlots, []);

  const minDay = min ? startOfDay(min) : undefined;

  const isSlotDisabled = (hours: number, minutes: number) => {
    if (!min || !value) return false;
    if (!isSameDay(value, min)) return false;
    return setMinutes(setHours(value, hours), minutes).getTime() < min.getTime();
  };

  const handleDayPick = (day: Date | undefined) => {
    if (!day) {
      onChange(undefined);
      return;
    }
    // Keep the time already chosen; otherwise default to the next valid slot.
    if (value) {
      onChange(setMinutes(setHours(day, value.getHours()), value.getMinutes()));
      return;
    }
    const base = min && isSameDay(day, min) ? min : setHours(day, 18);
    const rounded = setMinutes(
      base,
      Math.ceil(base.getMinutes() / SLOT_MINUTES) * SLOT_MINUTES
    );
    onChange(rounded);
  };

  const handleSlotPick = (hours: number, minutes: number) => {
    const base = value ?? min ?? new Date();
    onChange(setMinutes(setHours(base, hours), minutes));
  };

  const quickPicks = useMemo(() => {
    const anchor = min ?? new Date();
    return [
      { label: "Tomorrow 6pm", date: setMinutes(setHours(addDays(startOfDay(anchor), 1), 18), 0) },
      { label: "In 3 days", date: setMinutes(setHours(addDays(startOfDay(anchor), 3), 18), 0) },
      { label: "Next week", date: setMinutes(setHours(addDays(startOfDay(anchor), 7), 18), 0) },
    ].filter((q) => !min || q.date.getTime() >= min.getTime());
  }, [min]);

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            id={id}
            type="button"
            className={cn(
              "w-full flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-left text-sm sm:text-base transition-colors",
              "hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0",
              error ? "border-destructive" : "border-border"
            )}
          >
            <CalendarIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            {value ? (
              <span className="text-foreground truncate">
                {format(value, "EEE d MMM yyyy")}
                <span className="text-muted-foreground"> · </span>
                {format(value, "h:mm a")}
              </span>
            ) : (
              <span className="text-muted-foreground truncate">{placeholder}</span>
            )}
            {value && (
              <span
                role="button"
                tabIndex={-1}
                aria-label="Clear"
                onClick={(e) => { e.stopPropagation(); onChange(undefined); }}
                className="ml-auto p-0.5 rounded text-muted-foreground hover:text-foreground flex-shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </span>
            )}
          </button>
        </PopoverTrigger>

        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex flex-col sm:flex-row">
            <div className="border-b sm:border-b-0 sm:border-r border-border">
              <Calendar
                mode="single"
                selected={value}
                onSelect={handleDayPick}
                defaultMonth={value ?? min}
                disabled={minDay ? (date) => date < minDay : undefined}
                initialFocus
              />
              {quickPicks.length > 0 && (
                <div className="flex flex-wrap gap-1.5 px-3 pb-3">
                  {quickPicks.map((q) => (
                    <button
                      key={q.label}
                      type="button"
                      onClick={() => onChange(q.date)}
                      className="px-2 py-1 text-[11px] rounded-md bg-secondary text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="w-full sm:w-[7.5rem] flex flex-col">
              <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                Time
              </div>
              <div className="max-h-[16rem] overflow-y-auto p-1.5 grid grid-cols-3 sm:grid-cols-1 gap-1">
                {slots.map(({ hours, minutes }) => {
                  const selected =
                    value && value.getHours() === hours && value.getMinutes() === minutes;
                  const disabled = isSlotDisabled(hours, minutes);
                  return (
                    <button
                      key={`${hours}:${minutes}`}
                      type="button"
                      disabled={disabled}
                      onClick={() => handleSlotPick(hours, minutes)}
                      className={cn(
                        "px-2 py-1.5 rounded-md text-xs transition-colors text-center",
                        selected
                          ? "bg-primary text-primary-foreground font-medium"
                          : "text-foreground hover:bg-muted",
                        disabled && "opacity-30 cursor-not-allowed hover:bg-transparent"
                      )}
                    >
                      {format(setMinutes(setHours(new Date(), hours), minutes), "h:mm a")}
                    </button>
                  );
                })}
              </div>
              <div className="border-t border-border p-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="w-full py-1.5 rounded-md bg-accent hover:bg-accent/90 text-accent-foreground text-xs font-medium transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {error ? (
        <p className="mt-1.5 text-[11px] sm:text-xs text-destructive">{error}</p>
      ) : value ? (
        <p className="mt-1.5 text-[11px] sm:text-xs text-muted-foreground">{relativeHint(value)}</p>
      ) : null}
    </div>
  );
}

export default DateTimeField;
