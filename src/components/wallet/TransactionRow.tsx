import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { TX_LABELS, CREDIT_TYPES } from "@/data/walletData";
import type { WalletTransaction } from "@/data/walletData";

interface TransactionRowProps {
  tx: WalletTransaction;
  isLast: boolean;
}

const TransactionRow = ({ tx, isLast }: TransactionRowProps) => {
  const isCredit = CREDIT_TYPES.has(tx.type);
  const label = TX_LABELS[tx.type] ?? tx.type.replace(/_/g, " ");
  const date = new Date(tx.createdAt).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });

  return (
    <li
      className={`flex items-center justify-between px-3 sm:px-4 py-3 sm:py-4 hover:bg-muted/50 transition-colors ${
        !isLast ? "border-b border-border" : ""
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isCredit ? "bg-green-500/20" : "bg-red-500/20"
        }`}>
          {isCredit
            ? <ArrowDownLeft className="w-4 h-4 text-green-400" />
            : <ArrowUpRight className="w-4 h-4 text-red-400" />}
        </div>
        <div className="min-w-0">
          <p className="text-xs sm:text-sm text-foreground font-medium capitalize truncate">{label}</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground">{date}</p>
        </div>
      </div>
      <div className="text-right ml-3 flex-shrink-0">
        <span className={`text-sm sm:text-base font-semibold ${isCredit ? "text-green-400" : "text-red-400"}`}>
          {isCredit ? "+" : ""}{tx.amount.toLocaleString()} CP
        </span>
        <p className="text-[10px] text-muted-foreground">bal: {tx.balanceAfter.toLocaleString()}</p>
      </div>
    </li>
  );
};

export default TransactionRow;
