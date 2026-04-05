import { Wallet, ShoppingCart, ArrowUpRight, History } from "lucide-react";

export type WalletTab = "balance" | "purchase" | "withdraw" | "history";

export interface WalletTabConfig {
  id: WalletTab;
  label: string;
  icon: typeof Wallet;
}

export const WALLET_TABS: WalletTabConfig[] = [
  { id: "balance",  label: "Balance",             icon: Wallet },
  { id: "purchase", label: "Purchase Morgan",       icon: ShoppingCart },
  { id: "withdraw", label: "Withdraw Morgan",       icon: ArrowUpRight },
  { id: "history",  label: "Transaction History",  icon: History },
];
