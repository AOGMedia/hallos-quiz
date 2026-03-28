import { useState } from "react";
import WalletBalanceCard from "@/components/wallet/WalletBalanceCard";
import WalletBalanceTab from "@/components/wallet/WalletBalanceTab";
import WalletPurchaseTab from "@/components/wallet/WalletPurchaseTab";
import WalletWithdrawTab from "@/components/wallet/WalletWithdrawTab";
import WalletHistoryTab from "@/components/wallet/WalletHistoryTab";
import { WALLET_TABS, type WalletTab } from "@/components/wallet/walletTypes";
import { useChutaBalance, useChutaTransactions } from "@/hooks/useChutaWallet";
import { useChutaWalletStore } from "@/store/chutaWalletStore";

const PREVIEW_COUNT = 4;

const ChutaWallet = () => {
  const [activeTab, setActiveTab] = useState<WalletTab>("balance");

  // Balance: prefer live store value (updated by mutations), seed from query
  useChutaBalance();
  const balance = useChutaWalletStore((s) => s.balance);

  // Transactions for balance tab preview
  const { data: txData } = useChutaTransactions();
  const transactions = txData?.transactions ?? [];

  const totalEarned = transactions
    .filter((t) => Number(t.amount) > 0)
    .reduce((s, t) => s + Number(t.amount), 0);
  const totalSpent = Math.abs(
    transactions.filter((t) => Number(t.amount) < 0).reduce((s, t) => s + Number(t.amount), 0)
  );

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-6">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-3xl font-bold text-primary mb-1">Chuta Wallet</h1>
        <p className="text-xs sm:text-base text-muted-foreground">
          Manage your Chuta Points and track earnings
        </p>
      </div>

      {/* Balance card — always visible */}
      <WalletBalanceCard balance={balance} onTabChange={setActiveTab} />

      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto pb-1 mb-5 sm:mb-6 scrollbar-hide">
        {WALLET_TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
              activeTab === id
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "balance" && (
        <WalletBalanceTab
          totalEarned={totalEarned}
          totalSpent={totalSpent}
          recentTransactions={transactions.slice(0, PREVIEW_COUNT)}
        />
      )}
      {activeTab === "purchase" && <WalletPurchaseTab />}
      {activeTab === "withdraw" && <WalletWithdrawTab balance={balance} />}
      {activeTab === "history" && <WalletHistoryTab />}
    </div>
  );
};

export default ChutaWallet;
