"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface AdminCoupon {
  id: string;
  code: string;
  name: string;
  description: string | null;
  type: "PERCENTAGE" | "FIXED" | "FREE_SHIPPING";
  appliesTo: "ORDER" | "PRODUCT" | "SHIPPING" | "CATEGORY";
  value: number;
  minOrderValue: number | null;
  maxDiscount: number | null;
  usageLimit: number | null;
  usageLimitPerUser: number | null;
  usageCount: number;
  startDate: string | null;
  endDate: string | null;
  active: boolean;
  products: { product: { id: string; name: string } }[];
  categories: { category: { id: string; name: string } }[];
  _count: { orders: number };
  createdAt: string;
  updatedAt: string;
}

interface CouponsResponse {
  coupons: AdminCoupon[];
  total: number;
  page: number;
  totalPages: number;
}

interface CouponFilters {
  search?: string;
  status?: string;
  type?: string;
  sort?: string;
  order?: string;
  page?: number;
  limit?: number;
}

async function fetchCoupons(filters: CouponFilters): Promise<CouponsResponse> {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.status) params.set("status", filters.status);
  if (filters.type) params.set("type", filters.type);
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.order) params.set("order", filters.order);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.limit) params.set("limit", String(filters.limit));

  const res = await fetch(`/api/admin/coupons?${params}`);
  if (!res.ok) throw new Error("Erro ao buscar cupons");
  return res.json();
}

export function useAdminCoupons(filters: CouponFilters = {}) {
  return useQuery({
    queryKey: ["admin-coupons", filters],
    queryFn: () => fetchCoupons(filters),
  });
}

export function useCreateCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao criar cupom");
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-coupons"] }),
  });
}

export function useUpdateCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const res = await fetch(`/api/admin/coupons/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao atualizar cupom");
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-coupons"] }),
  });
}

export function useDeleteCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir cupom");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-coupons"] }),
  });
}
