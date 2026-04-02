import { Zap } from "lucide-react";

interface WagerBadgeProps {
  amount: number;
  label?: string;
  size?: "sm" | "md";
}

const WagerBadge = ({ amount, label = "Wager", size = "md" }: WagerBadgeProps) => (
  <div className={`flex items-center justify-between p-3 sm:p-4 bg-card border border-border rounded-xl ${size === "sm" ? "py-2" : ""}`}>
    <div className="flex items-center gap-2">
      <Zap className={`text-warning ${size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"}`} />
      <span className={`text-muted-foreground ${size === "sm" ? "text-xs" : "text-xs sm:text-sm"}`}>{label}</span>
    </div>
    <span className={`font-bold text-foreground ${size === "sm" ? "text-sm" : "text-sm sm:text-base"}`}>
      {amount.toLocaleString()} MP
    </span>
  </div>
);

export default WagerBadge;
