"use client";

import { useQuery } from "@tanstack/react-query";

export interface AdminClient {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  cpf: string | null;
  cnpj: string | null;
  avatar: string | null;
  city: string | null;
  state: string | null;
  totalPurchases: number;
  cashback: number;
  isVip: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { orders: number; reviews: number; favorites: number };
}

interface ClientsResponse {
  clients: AdminClient[];
  total: number;
  page: number;
  totalPages: number;
}

interface ClientFilters {
  search?: string;
  sort?: string;
  order?: string;
  page?: number;
  limit?: number;
}

export function useAdminClients(filters: ClientFilters = {}) {
  return useQuery({
    queryKey: ["admin-clients", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, String(v)); });
      const res = await fetch(`/api/admin/clients?${params}`);
      if (!res.ok) throw new Error("Erro ao buscar clientes");
      return res.json() as Promise<ClientsResponse>;
    },
  });
}

export function useAdminClient(id: string | null) {
  return useQuery({
    queryKey: ["admin-client", id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/clients/${id}`);
      if (!res.ok) throw new Error("Erro ao buscar cliente");
      return res.json();
    },
    enabled: !!id,
  });
}
