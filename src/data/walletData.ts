import type { ChutaTransaction, TransactionType } from "@/lib/api/chutaWallet";

// Re-export so components import from one place
export type { ChutaTransaction as WalletTransaction };

export interface PurchasePackage {
  id: string;
  cp: number;
  price: string;
  bonus: string | null;
}

// Human-readable labels for each transaction type
export const TX_LABELS: Record<TransactionType, string> = {
  initial_bonus:     "Welcome bonus",
  purchase:          "CP purchase",
  withdrawal:        "CP withdrawal",
  match_wager:       "Match wager",
  match_win:         "Match win",
  match_refund:      "Match refund",
  tournament_entry:  "Tournament entry",
  tournament_prize:  "Tournament prize",
  tournament_refund: "Tournament refund",
};

// Types that represent incoming CP (shown as positive / green)
export const CREDIT_TYPES = new Set<TransactionType>([
  "initial_bonus", "match_win", "match_refund",
  "tournament_prize", "tournament_refund",
]);

export const CP_TO_NGN = 14;
export const MIN_WITHDRAW = 1000;

export const purchasePackages: PurchasePackage[] = [
  { id: "1", cp: 100,  price: "₦1,400",  bonus: null },
  { id: "2", cp: 357,  price: "₦5,000",  bonus: null },
  { id: "3", cp: 714,  price: "₦10,000", bonus: null },
  { id: "4", cp: 1785, price: "₦25,000", bonus: null },
  { id: "5", cp: 3571, price: "₦50,000", bonus: null },
];

export const packageNgnAmounts: Record<string, number> = {
  "1": 1400,
  "2": 5000,
  "3": 10000,
  "4": 25000,
  "5": 50000,
};
