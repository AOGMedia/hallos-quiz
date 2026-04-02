import { Zap, ShoppingCart, ArrowUpRight, History, Wallet } from "lucide-react";
import type { WalletTab } from "@/components/wallet/walletTypes";

interface WalletBalanceCardProps {
  balance: number;
  onTabChange: (tab: WalletTab) => void;
}

const WalletBalanceCard = ({ balance, onTabChange }: WalletBalanceCardProps) => (
  <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary/30 via-card to-accent/20 border border-border p-5 sm:p-8 mb-6 sm:mb-8">
    <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />

    <div className="flex items-center gap-2 mb-3">
      <Wallet className="w-4 h-4 text-muted-foreground" />
      <span className="text-xs sm:text-sm text-muted-foreground uppercase tracking-wider">
        Total Balance
      </span>
    </div>

    <div className="flex items-end gap-2 mb-6">
      <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-warning mb-1" />
      <span className="text-4xl sm:text-6xl font-bold text-foreground">
        {balance.toLocaleString()}
      </span>
      <span className="text-lg sm:text-2xl text-muted-foreground mb-1">MP</span>
    </div>

    <div className="flex flex-wrap gap-3">
      <button
        onClick={() => onTabChange("purchase")}
        className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm font-medium transition-colors"
      >
        <ShoppingCart className="w-4 h-4" /> Buy MP
      </button>
      <button
        onClick={() => onTabChange("withdraw")}
        className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-xl bg-card border border-border hover:bg-muted text-foreground text-xs sm:text-sm font-medium transition-colors"
      >
        <ArrowUpRight className="w-4 h-4" /> Withdraw
      </button>
      <button
        onClick={() => onTabChange("history")}
        className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-xl bg-card border border-border hover:bg-muted text-foreground text-xs sm:text-sm font-medium transition-colors"
      >
        <History className="w-4 h-4" /> History
      </button>
    </div>
  </div>
);

export default WalletBalanceCard;
