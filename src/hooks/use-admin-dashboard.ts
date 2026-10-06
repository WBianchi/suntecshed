"use client";

import { useQuery } from "@tanstack/react-query";

export interface DashboardData {
  kpis: {
    revenue: { value: number; change: number };
    orders: { value: number; change: number };
    newCustomers: { value: number; change: number };
    avgTicket: { value: number; change: number };
  };
  today: {
    revenue: number;
    orders: number;
    visitors: number;
    conversion: number;
  };
  totals: {
    products: number;
    customers: number;
    orders: number;
    lowStock: number;
    coupons: number;
  };
  revenueByMonth: { month: string; value: number }[];
  recentOrders: {
    id: string;
    orderNumber: string;
    customer: string;
    total: number;
    status: string;
    paymentMethod: string | null;
    itemCount: number;
    createdAt: string;
  }[];
  topProducts: {
    id: string;
    name: string;
    image: string | null;
    sold: number;
    revenue: number;
  }[];
  orderStatusDistribution: { status: string; count: number }[];
  recentClients: { name: string; createdAt: string }[];
}

async function fetchDashboard(): Promise<DashboardData> {
  const res = await fetch("/api/admin/dashboard");
  if (!res.ok) throw new Error("Falha ao carregar dashboard");
  return res.json();
}

export function useAdminDashboard() {
  return useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: fetchDashboard,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}
