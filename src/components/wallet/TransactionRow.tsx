import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import type { WalletTransaction } from "@/data/walletData";

interface TransactionRowProps {
  tx: WalletTransaction;
  isLast: boolean;
}

const TransactionRow = ({ tx, isLast }: TransactionRowProps) => {
  const isCredit = tx.amount > 0;

  return (
    <li
      className={`flex items-center justify-between px-3 sm:px-4 py-3 sm:py-4 hover:bg-muted/50 transition-colors ${
        !isLast ? "border-b border-border" : ""
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
            isCredit ? "bg-green-500/20" : "bg-red-500/20"
          }`}
        >
          {isCredit
            ? <ArrowDownLeft className="w-4 h-4 text-green-400" />
            : <ArrowUpRight className="w-4 h-4 text-red-400" />}
        </div>
        <div className="min-w-0">
          <p className="text-xs sm:text-sm text-foreground font-medium truncate">{tx.description}</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground">{tx.date}</p>
        </div>
      </div>
      <span
        className={`text-sm sm:text-base font-semibold whitespace-nowrap ml-3 ${
          isCredit ? "text-green-400" : "text-red-400"
        }`}
      >
        {isCredit ? "+" : ""}{tx.amount.toLocaleString()} CP
      </span>
    </li>
  );
};

export default TransactionRow;
