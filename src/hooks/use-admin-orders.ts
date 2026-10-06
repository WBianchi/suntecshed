"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  variant: string | null;
  image: string | null;
  product: { id: string; name: string; slug: string };
}

export interface AdminOrder {
  id: string;
  orderNumber: string;
  status: string;
  paymentMethod: string | null;
  paymentStatus: string;
  paymentId: string | null;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  trackingCode: string | null;
  shippingMethod: string | null;
  meServiceId: string | null;
  notes: string | null;
  user: { id: string; name: string; email: string; phone: string | null; avatar: string | null };
  items: OrderItem[];
  coupon: { id: string; code: string; name: string } | null;
  address: {
    id: string; name: string; street: string; number: string;
    complement: string | null; neighborhood: string; city: string;
    state: string; zipCode: string;
  } | null;
  shippingSnapshot: {
    name: string | null; cpf: string | null; cnpj: string | null;
    street: string; number: string; complement: string | null;
    neighborhood: string | null; city: string | null; state: string | null; zipCode: string | null;
  } | null;
  legacyStatus: string | null;
  recipientName: string | null;
  recipientDocument: string | null;
  labelUrl: string | null;
  walletAmountUsed: number;
  createdAt: string;
  updatedAt: string;
}

interface OrdersResponse {
  orders: AdminOrder[];
  total: number;
  page: number;
  totalPages: number;
}

interface OrderFilters {
  search?: string;
  status?: string;
  paymentStatus?: string;
  dateFrom?: string;
  dateTo?: string;
  hasLabel?: boolean;
  trash?: boolean;
  sort?: string;
  order?: string;
  page?: number;
  limit?: number;
}

async function fetchOrders(filters: OrderFilters): Promise<OrdersResponse> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, String(v)); });
  const res = await fetch(`/api/admin/orders?${params}`);
  if (!res.ok) throw new Error("Erro ao buscar pedidos");
  return res.json();
}

export function useAdminOrders(filters: OrderFilters = {}) {
  return useQuery({
    queryKey: ["admin-orders", filters],
    queryFn: () => fetchOrders(filters),
  });
}

export function useAdminOrder(id: string | null) {
  return useQuery({
    queryKey: ["admin-order", id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/orders/${id}`);
      if (!res.ok) throw new Error("Erro ao buscar pedido");
      return res.json() as Promise<AdminOrder>;
    },
    enabled: !!id,
  });
}

export function useUpdateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: any }) => {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao atualizar pedido");
      }
      return res.json();
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      qc.invalidateQueries({ queryKey: ["admin-order", vars.id] });
    },
  });
}

export function useBulkOrderAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { ids: string[]; action: "status" | "trash" | "restore" | "delete"; status?: string }) => {
      const res = await fetch("/api/admin/orders/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao executar ação em massa");
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
    },
  });
}

export function useBuyShippingLabel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string) => {
      const res = await fetch(`/api/admin/orders/${orderId}/buy-label`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao comprar etiqueta");
      }
      return res.json() as Promise<{ labelUrl: string; trackingCode: string | null }>;
    },
    onSuccess: (_, orderId) => {
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      qc.invalidateQueries({ queryKey: ["admin-order", orderId] });
    },
  });
}
