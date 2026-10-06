"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface ShippingRule {
  id: string;
  name: string;
  price: number;
  estimatedDays: number | null;
  country: string | null;
  state: string | null;
  city: string | null;
  cepRangeStart: string | null;
  cepRangeEnd: string | null;
  active: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export type ShippingRuleInput = Omit<ShippingRule, "id" | "createdAt" | "updatedAt">;

export function useAdminShippingRules() {
  return useQuery({
    queryKey: ["admin-shipping-rules"],
    queryFn: async () => {
      const res = await fetch("/api/admin/shipping-rules");
      if (!res.ok) throw new Error("Erro ao buscar regras de frete");
      return res.json() as Promise<{ rules: ShippingRule[] }>;
    },
  });
}

export function useCreateShippingRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<ShippingRuleInput>) => {
      const res = await fetch("/api/admin/shipping-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao criar regra");
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-shipping-rules"] }),
  });
}

export function useUpdateShippingRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<ShippingRuleInput>) => {
      const res = await fetch(`/api/admin/shipping-rules/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao atualizar regra");
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-shipping-rules"] }),
  });
}

export function useDeleteShippingRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/shipping-rules/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao excluir regra");
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-shipping-rules"] }),
  });
}
