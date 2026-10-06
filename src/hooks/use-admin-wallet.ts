"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface WalletClient {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  cashback: number;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  type: "CREDIT" | "DEBIT";
  amount: number;
  balanceAfter: number;
  source: "MANUAL" | "RECHARGE_PIX" | "RECHARGE_CARD" | "ORDER_CASHBACK" | "ORDER_PAYMENT" | "MIGRATION";
  description: string | null;
  orderId: string | null;
  createdBy: string | null;
  createdAt: string;
}

interface WalletResponse {
  clients: WalletClient[];
  total: number;
  page: number;
  totalPages: number;
  stats: { totalBalance: number; withBalanceCount: number };
}

interface WalletFilters {
  search?: string;
  page?: number;
  limit?: number;
}

export function useAdminWallet(filters: WalletFilters = {}) {
  return useQuery({
    queryKey: ["admin-wallet", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, String(v)); });
      const res = await fetch(`/api/admin/wallet?${params}`);
      if (!res.ok) throw new Error("Erro ao buscar carteiras");
      return res.json() as Promise<WalletResponse>;
    },
  });
}

export function useAdminWalletDetail(userId: string | null) {
  return useQuery({
    queryKey: ["admin-wallet-detail", userId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/wallet/${userId}`);
      if (!res.ok) throw new Error("Erro ao buscar extrato");
      return res.json() as Promise<{ user: WalletClient; transactions: WalletTransaction[] }>;
    },
    enabled: !!userId,
  });
}

export function useAdminWalletTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { userId: string; type: "CREDIT" | "DEBIT"; amount: number; description?: string }) => {
      const res = await fetch("/api/admin/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao registrar transação");
      }
      return res.json();
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["admin-wallet"] });
      qc.invalidateQueries({ queryKey: ["admin-wallet-detail", vars.userId] });
      qc.invalidateQueries({ queryKey: ["admin-clients"] });
    },
  });
}
