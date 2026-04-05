import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  fetchChutaBalance,
  fetchChutaTransactions,
  purchaseChuta,
  withdrawChuta,
  type PurchaseChutaPayload,
  type WithdrawChutaPayload,
  type ChutaTransactionsParams,
} from "@/lib/api/chutaWallet";
import { useChutaWalletStore } from "@/store/chutaWalletStore";

export const CHUTA_KEYS = {
  balance: ["chuta", "balance"] as const,
  transactions: ["chuta", "transactions"] as const,
};

// ── Balance ───────────────────────────────────────────────────────────────────

export function useChutaBalance() {
  const setBalance = useChutaWalletStore((s) => s.setBalance);

  const query = useQuery({
    queryKey: CHUTA_KEYS.balance,
    queryFn: fetchChutaBalance,
    staleTime: 30_000,
  });

  // Sync API balance into Zustand store
  useEffect(() => {
    if (query.data?.balance !== undefined) {
      setBalance(query.data.balance);
    }
  }, [query.data, setBalance]);

  return query;
}

// ── Transactions ──────────────────────────────────────────────────────────────

export function useChutaTransactions(params: ChutaTransactionsParams = {}) {
  return useQuery({
    queryKey: [...CHUTA_KEYS.transactions, params],
    queryFn: () => fetchChutaTransactions(params),
    staleTime: 30_000,
  });
}

// ── Purchase ──────────────────────────────────────────────────────────────────

export function usePurchaseChuta() {
  const qc = useQueryClient();
  const setBalance = useChutaWalletStore((s) => s.setBalance);

  return useMutation({
    mutationFn: (payload: PurchaseChutaPayload) => purchaseChuta(payload),
    onSuccess: (data) => {
      setBalance(data.newBalance);
      // Invalidate so balance + history refetch
      qc.invalidateQueries({ queryKey: CHUTA_KEYS.balance });
      qc.invalidateQueries({ queryKey: CHUTA_KEYS.transactions });
    },
  });
}

// ── Withdraw ──────────────────────────────────────────────────────────────────

export function useWithdrawChuta() {
  const qc = useQueryClient();
  const setBalance = useChutaWalletStore((s) => s.setBalance);

  return useMutation({
    mutationFn: (payload: WithdrawChutaPayload) => withdrawChuta(payload),
    onSuccess: (data) => {
      setBalance(data.newBalance);
      qc.invalidateQueries({ queryKey: CHUTA_KEYS.balance });
      qc.invalidateQueries({ queryKey: CHUTA_KEYS.transactions });
    },
  });
}

// ── Hallos wallet balance ─────────────────────────────────────────────────────

import { getWalletBalance } from "@/lib/api/chutaWallet";

export function useHallosBalance(currency = "NGN") {
  return useQuery({
    queryKey: ["hallos", "balance", currency],
    queryFn: () => getWalletBalance(currency),
    staleTime: 30_000,
  });
}

export function useHallosBalances() {
  const ngn = useQuery({
    queryKey: ["hallos", "balance", "NGN"],
    queryFn: () => getWalletBalance("NGN"),
    staleTime: 30_000,
  });
  const usd = useQuery({
    queryKey: ["hallos", "balance", "USD"],
    queryFn: () => getWalletBalance("USD"),
    staleTime: 30_000,
  });
  return { ngn, usd, isLoading: ngn.isLoading || usd.isLoading };
}
