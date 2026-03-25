import TransactionRow from "./TransactionRow";
import { useChutaTransactions } from "@/hooks/useChutaWallet";
import { mockTransactions } from "@/data/walletData";
import type { WalletTransaction } from "@/data/walletData";

const WalletHistoryTab = () => {
  const { data, isLoading, isError } = useChutaTransactions();

  // Use API data when available, fall back to mock
  const transactions: WalletTransaction[] =
    data?.transactions ?? mockTransactions;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-3 sm:p-4 border-b border-border">
        <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
          All Transactions
        </h3>
      </div>

      {isLoading && (
        <div className="p-6 text-center text-xs sm:text-sm text-muted-foreground">
          Loading transactions…
        </div>
      )}

      {isError && (
        <div className="p-6 text-center text-xs sm:text-sm text-muted-foreground">
          Could not load transactions. Showing cached data.
        </div>
      )}

      {!isLoading && (
        <ul>
          {transactions.map((tx, i) => (
            <TransactionRow
              key={tx.id}
              tx={tx}
              isLast={i === transactions.length - 1}
            />
          ))}
        </ul>
      )}
    </div>
  );
};

export default WalletHistoryTab;
