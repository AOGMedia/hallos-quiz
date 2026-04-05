import apiClient from "./client";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ChutaCurrency = "NGN" | "USD";

export interface ChutaBalanceResponse {
  success: boolean;
  balance: number;
  lastUpdated?: string;
}

export interface PurchaseChutaPayload {
  amount: number;
  currency: ChutaCurrency;
}

export interface PurchaseChutaResponse {
  success: boolean;
  chutaAmount: number;
  newBalance: number;
  transactionId: string;
  sourceAmount: number;
  sourceCurrency: ChutaCurrency;
}

export interface WithdrawChutaPayload {
  chutaAmount: number;
  currency: ChutaCurrency;
}

export interface WithdrawChutaResponse {
  success: boolean;
  amount: number;
  currency: ChutaCurrency;
  feeAmount: number;
  newBalance: number;
  transactionId: string;
}

export type TransactionType =
  | "initial_bonus"
  | "purchase"
  | "withdrawal"
  | "match_wager"
  | "match_win"
  | "match_refund"
  | "tournament_entry"
  | "tournament_prize"
  | "tournament_refund";

export interface ChutaTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  balanceAfter: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface ChutaTransactionsParams {
  type?: TransactionType;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface ChutaTransactionsResponse {
  success: boolean;
  transactions: ChutaTransaction[];
  totalCount: number;
  page: number;
  totalPages: number;
}

// ── API functions ─────────────────────────────────────────────────────────────

export const fetchChutaBalance = async (): Promise<ChutaBalanceResponse> => {
  const res = await apiClient.get<ChutaBalanceResponse>("/api/quiz/user/balance");
  return res.data;
};

export const purchaseChuta = async (
  payload: PurchaseChutaPayload
): Promise<PurchaseChutaResponse> => {
  const res = await apiClient.post<PurchaseChutaResponse>(
    "/api/quiz/currency/purchase",
    payload
  );
  return res.data;
};

export const withdrawChuta = async (
  payload: WithdrawChutaPayload
): Promise<WithdrawChutaResponse> => {
  const res = await apiClient.post<WithdrawChutaResponse>(
    "/api/quiz/currency/withdraw",
    payload
  );
  return res.data;
};

export const fetchChutaTransactions = async (
  params: ChutaTransactionsParams = {}
): Promise<ChutaTransactionsResponse> => {
  const res = await apiClient.get<ChutaTransactionsResponse>(
    "/api/quiz/user/transactions",
    { params: { page: 1, limit: 20, ...params } }
  );
  return res.data;
};

// ── Hallos wallet balance ─────────────────────────────────────────────────────

export interface HallosBalanceEntry {
  availableBalance: number;
  pendingBalance: number;
  totalBalance: number;
  currency: string;
  requiredGateway?: string;
  id?: string;
}

export interface HallosWalletBalanceResponse {
  success: boolean;
  balance?: HallosBalanceEntry;
  balances?: Record<string, HallosBalanceEntry>;
}

export const getWalletBalance = async (
  currency?: string
): Promise<HallosWalletBalanceResponse> => {
  const res = await apiClient.get<HallosWalletBalanceResponse>(
    "/api/wallet/balance",
    { params: currency ? { currency } : undefined }
  );
  return res.data;
};
