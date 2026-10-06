"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface VipMember {
  id: string;
  name: string;
  email: string;
  isVip: boolean;
  vipActivatedAt: string | null;
  vipExpiresAt: string | null;
}

interface VipResponse {
  members: VipMember[];
  total: number;
  page: number;
  totalPages: number;
  stats: { active: number; expiringSoon: number };
}

interface VipFilters {
  search?: string;
  page?: number;
  limit?: number;
}

export function useAdminVip(filters: VipFilters = {}) {
  return useQuery({
    queryKey: ["admin-vip", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, String(v)); });
      const res = await fetch(`/api/admin/vip?${params}`);
      if (!res.ok) throw new Error("Erro ao buscar membros VIP");
      return res.json() as Promise<VipResponse>;
    },
  });
}

export function useActivateVip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, durationDays }: { userId: string; durationDays: number }) => {
      const res = await fetch("/api/admin/vip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, durationDays }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao ativar VIP");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-vip"] });
      qc.invalidateQueries({ queryKey: ["admin-clients"] });
    },
  });
}

export function useUpdateVip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, action, durationDays }: { id: string; action: "extend" | "deactivate"; durationDays?: number }) => {
      const res = await fetch(`/api/admin/vip/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, durationDays }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao atualizar VIP");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-vip"] });
      qc.invalidateQueries({ queryKey: ["admin-clients"] });
    },
  });
}
