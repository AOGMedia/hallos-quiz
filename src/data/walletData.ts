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

export const mockTransactions: ChutaTransaction[] = [
  { id: "1", type: "tournament_prize",  amount: 900,  balanceAfter: 900,  createdAt: "2026-01-05T10:00:00.000Z" },
  { id: "2", type: "tournament_entry",  amount: -200, balanceAfter: 700,  createdAt: "2026-01-02T10:00:00.000Z" },
  { id: "3", type: "match_win",         amount: 50,   balanceAfter: 750,  createdAt: "2025-12-28T10:00:00.000Z" },
  { id: "4", type: "tournament_entry",  amount: -150, balanceAfter: 600,  createdAt: "2025-12-23T10:00:00.000Z" },
  { id: "5", type: "tournament_prize",  amount: 500,  balanceAfter: 1100, createdAt: "2025-12-19T10:00:00.000Z" },
  { id: "6", type: "match_win",         amount: 300,  balanceAfter: 1400, createdAt: "2025-12-09T10:00:00.000Z" },
];

// NGN amounts sent to API — API converts: NGN ÷ 1400 × 100 = Chuta
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

export const CP_TO_NGN = 14;
export const MIN_WITHDRAW = 1000;
