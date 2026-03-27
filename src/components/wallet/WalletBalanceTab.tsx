import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import TransactionRow from "./TransactionRow";
import type { WalletTransaction } from "@/data/walletData";

interface WalletBalanceTabProps {
  totalEarned: number;
  totalSpent: number;
  recentTransactions: WalletTransaction[];
}

const WalletBalanceTab = ({ totalEarned, totalSpent, recentTransactions }: WalletBalanceTabProps) => (
  <>
    {/* Stats */}
    <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
      <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-2 sm:mb-3">
          <div className="w-7 h-7 rounded-lg bg-green-500/20 flex items-center justify-center">
            <ArrowDownLeft className="w-3.5 h-3.5 text-green-400" />
          </div>
          <span className="text-xs sm:text-sm text-muted-foreground">Total Earned</span>
        </div>
        <p className="text-xl sm:text-3xl font-bold text-green-400">+{totalEarned.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        <p className="text-xs text-muted-foreground mt-1">CP earned from wins</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-2 sm:mb-3">
          <div className="w-7 h-7 rounded-lg bg-red-500/20 flex items-center justify-center">
            <ArrowUpRight className="w-3.5 h-3.5 text-red-400" />
          </div>
          <span className="text-xs sm:text-sm text-muted-foreground">Total Spent</span>
        </div>
        <p className="text-xl sm:text-3xl font-bold text-red-400">-{totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        <p className="text-xs text-muted-foreground mt-1">CP spent on entries</p>
      </div>
    </div>

    {/* Recent transactions preview */}
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-3 sm:p-4 border-b border-border">
        <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
          Recent Transactions
        </h3>
      </div>
      <ul>
        {recentTransactions.map((tx, i) => (
          <TransactionRow key={tx.id} tx={tx} isLast={i === recentTransactions.length - 1} />
        ))}
      </ul>
    </div>
  </>
);

export default WalletBalanceTab;
