import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

interface NicknameInputProps {
  value: string;
  onChange: (val: string) => void;
  isChecking: boolean;
  isAvailable: boolean | null; // null = not checked yet
  error?: string;
}

const NicknameInput = ({ value, onChange, isChecking, isAvailable, error }: NicknameInputProps) => (
  <div>
    <label className="block text-xs sm:text-sm text-muted-foreground mb-2">
      Nickname <span className="text-muted-foreground/60">(3–30 chars, letters/numbers/_)</span>
    </label>
    <div className="relative">
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. DragonSlayer99"
        maxLength={30}
        className="bg-card border-border text-foreground placeholder:text-muted-foreground pr-9 text-sm sm:text-base"
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2">
        {isChecking && <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />}
        {!isChecking && isAvailable === true && (
          <CheckCircle2 className="w-4 h-4 text-green-400" />
        )}
        {!isChecking && isAvailable === false && (
          <XCircle className="w-4 h-4 text-red-400" />
        )}
      </span>
    </div>
    {!isChecking && isAvailable === true && (
      <p className="text-xs text-green-400 mt-1">Nickname is available</p>
    )}
    {!isChecking && isAvailable === false && (
      <p className="text-xs text-red-400 mt-1">Nickname is taken</p>
    )}
    {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
  </div>
);

export default NicknameInput;
