import apiClient from "./client";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ChutaCurrency = "NGN" | "USD";

export interface ChutaBalanceResponse {
  success: boolean;
  balance: number;
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

export interface ChutaTransaction {
  id: string;
  type: "credit" | "debit";
  description: string;
  amount: number;
  date: string;
}

export interface ChutaTransactionsResponse {
  success: boolean;
  transactions: ChutaTransaction[];
}

// ── API functions ─────────────────────────────────────────────────────────────

export const fetchChutaBalance = async (): Promise<ChutaBalanceResponse> => {
  const res = await apiClient.get<ChutaBalanceResponse>("/api/quiz/currency/balance");
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

export const fetchChutaTransactions =
  async (): Promise<ChutaTransactionsResponse> => {
    const res = await apiClient.get<ChutaTransactionsResponse>(
      "/api/quiz/currency/transactions"
    );
    return res.data;
  };
