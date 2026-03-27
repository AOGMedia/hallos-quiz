import { useState } from "react";
import TransactionRow from "./TransactionRow";
import { useChutaTransactions } from "@/hooks/useChutaWallet";
import { mockTransactions, TX_LABELS } from "@/data/walletData";
import type { TransactionType } from "@/lib/api/chutaWallet";

const TYPE_FILTERS: { label: string; value: TransactionType | "all" }[] = [
  { label: "All",        value: "all" },
  { label: "Wins",       value: "match_win" },
  { label: "Wagers",     value: "match_wager" },
  { label: "Tournaments",value: "tournament_prize" },
  { label: "Purchases",  value: "purchase" },
  { label: "Withdrawals",value: "withdrawal" },
];

const WalletHistoryTab = () => {
  const [typeFilter, setTypeFilter] = useState<TransactionType | "all">("all");

  const { data, isLoading, isError } = useChutaTransactions(
    typeFilter !== "all" ? { type: typeFilter } : {}
  );

  const transactions = data?.transactions ?? mockTransactions;
  const filtered = typeFilter === "all"
    ? transactions
    : transactions.filter((t) => t.type === typeFilter);

  return (
    <div className="space-y-3">
      {/* Type filter chips */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
        {TYPE_FILTERS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setTypeFilter(value)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              typeFilter === value
                ? "bg-primary border-primary text-primary-foreground"
                : "bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-3 sm:p-4 border-b border-border flex items-center justify-between">
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
            {typeFilter === "all" ? "All Transactions" : TX_LABELS[typeFilter]}
          </h3>
          {data && (
            <span className="text-[10px] text-muted-foreground">
              {data.totalCount} total
            </span>
          )}
        </div>

        {isLoading && (
          <div className="p-6 text-center text-xs sm:text-sm text-muted-foreground">
            Loading transactions…
          </div>
        )}

        {!isLoading && (
          filtered.length === 0 ? (
            <div className="p-6 text-center text-xs sm:text-sm text-muted-foreground">
              No transactions found
            </div>
          ) : (
            <>
              {isError && (
                <div className="px-3 sm:px-4 py-2 bg-warning/10 border-b border-border text-[10px] sm:text-xs text-warning">
                  API unavailable — showing sample data
                </div>
              )}
              <ul>
                {filtered.map((tx, i) => (
                  <TransactionRow
                    key={tx.id}
                    tx={tx}
                    isLast={i === filtered.length - 1}
                  />
                ))}
              </ul>
            </>
          )
        )}
      </div>
    </div>
  );
};

export default WalletHistoryTab;
