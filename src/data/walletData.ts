export interface WalletTransaction {
  id: string;
  type: "credit" | "debit";
  description: string;
  amount: number;
  date: string;
}

export interface PurchasePackage {
  id: string;
  cp: number;
  price: string;
  bonus: string | null;
}

export const mockTransactions: WalletTransaction[] = [
  { id: "1", type: "credit", description: "Tournament win — Science Sprints", amount: 900, date: "Jan 05, 2026" },
  { id: "2", type: "debit", description: "Tournament entry — General Knowledge", amount: -200, date: "Jan 02, 2026" },
  { id: "3", type: "credit", description: "Challenge win vs BrainBlitz", amount: 50, date: "Dec 28, 2025" },
  { id: "4", type: "debit", description: "Tournament entry — Math Duel", amount: -150, date: "Dec 23, 2025" },
  { id: "5", type: "credit", description: "Top 10 finish — Programming Championship", amount: 500, date: "Dec 19, 2025" },
  { id: "6", type: "credit", description: "Final round — English & Grammar Wars", amount: 300, date: "Dec 09, 2025" },
];

// NGN amounts sent to API — API converts: NGN ÷ 1400 × 100 = Chuta
export const purchasePackages: PurchasePackage[] = [
  { id: "1", cp: 100,  price: "₦1,400",  bonus: null },
  { id: "2", cp: 357,  price: "₦5,000",  bonus: null },
  { id: "3", cp: 714,  price: "₦10,000", bonus: null },
  { id: "4", cp: 1785, price: "₦25,000", bonus: null },
  { id: "5", cp: 3571, price: "₦50,000", bonus: null },
];

// NGN amounts corresponding to each package (sent to API)
export const packageNgnAmounts: Record<string, number> = {
  "1": 1400,
  "2": 5000,
  "3": 10000,
  "4": 25000,
  "5": 50000,
};

// Conversion: 1 CP = 14 NGN (NGN ÷ 1400 × 100)
export const CP_TO_NGN = 14;

export const MIN_WITHDRAW = 1000; // API minimum: 1000 Chuta
