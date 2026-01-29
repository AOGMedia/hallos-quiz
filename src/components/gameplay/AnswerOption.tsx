import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

type AnswerState = "default" | "selected" | "correct" | "wrong" | "opponent-wrong";

interface AnswerOptionProps {
  label: string;
  value: string;
  state: AnswerState;
  points?: number;
  onClick?: () => void;
  disabled?: boolean;
}

const AnswerOption = ({
  label,
  value,
  state,
  points,
  onClick,
  disabled = false,
}: AnswerOptionProps) => {
  const getStateStyles = () => {
    switch (state) {
      case "selected":
        return "bg-secondary border-primary";
      case "correct":
        return "bg-success/20 border-success";
      case "wrong":
        return "bg-destructive/20 border-destructive";
      case "opponent-wrong":
        return "bg-destructive/20 border-destructive";
      default:
        return "bg-card border-border hover:border-muted-foreground";
    }
  };

  const getIcon = () => {
    if (state === "correct") {
      return <Check className="w-4 h-4 text-success" />;
    }
    if (state === "wrong" || state === "opponent-wrong") {
      return <X className="w-4 h-4 text-destructive" />;
    }
    return null;
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full flex items-center justify-between p-4 rounded-xl border transition-all",
        getStateStyles(),
        disabled && "cursor-not-allowed opacity-70"
      )}
    >
      <div className="flex items-center gap-3">
        {getIcon() || <span className="text-xs text-muted-foreground">{label}</span>}
        <span className="text-sm text-foreground">{value}</span>
      </div>
      {points && state === "correct" && (
        <span className="text-xs text-accent font-medium">⚡ +{points}</span>
      )}
    </button>
  );
};

export default AnswerOption;
