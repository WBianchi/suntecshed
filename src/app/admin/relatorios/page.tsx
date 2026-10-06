"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import {
  FiEye, FiMousePointer, FiShoppingCart, FiDollarSign,
  FiUsers, FiTrendingUp, FiTrendingDown, FiBarChart2,
  FiPackage, FiExternalLink, FiRefreshCw,
} from "react-icons/fi";

function formatBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function formatNum(v: number) {
  return v.toLocaleString("pt-BR");
}

function pctChange(current: number, prev: number): { pctValue: string; pctPositive: boolean } {
  if (prev === 0) return { pctValue: current > 0 ? "+100%" : "0%", pctPositive: current > 0 };
  const pct = ((current - prev) / prev) * 100;
  return { pctValue: `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`, pctPositive: pct >= 0 };
}

interface ReportData {
  kpis: {
    pageViews: number; prevPageViews: number;
    productClicks: number; prevProductClicks: number;
    orders: number; prevOrders: number;
    revenue: number; prevRevenue: number;
    uniqueVisitors: number;
    conversionRate: number;
    avgOrderValue: number;
  };
  topPages: { page: string; views: number }[];
  topProducts: { productId: string; name: string; slug?: string; image?: string; clicks: number }[];
  dailyViews: { date: string; views: number }[];
  dailyOrders: { date: string; orders: number; revenue: number }[];
  referrers: { referrer: string; count: number }[];
  period: string;
}

function useReports(period: string) {
  return useQuery({
    queryKey: ["admin-reports-overview", period],
    queryFn: async () => {
      const res = await fetch(`/api/admin/reports/overview?period=${period}`);
      if (!res.ok) throw new Error("Erro ao buscar relatórios");
      return res.json() as Promise<ReportData>;
    },
  });
}

const currentYear = new Date().getFullYear();
const periods = [
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "90d", label: "90 dias" },
  { value: "365d", label: "1 ano" },
  ...Array.from({ length: currentYear - 2023 + 1 }, (_, i) => {
    const year = 2023 + i;
    return { value: String(year), label: String(year) };
  }),
  { value: "all", label: "Tudo" },
];

export default function ReportsOverviewPage() {
  const [period, setPeriod] = useState("30d");
  const { data, isLoading, refetch } = useReports(period);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
          <p className="mt-0.5 text-sm text-gray-500">Visão geral de tráfego, conversões e vendas</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {periods.map((p) => (
            <button key={p.value} onClick={() => setPeriod(p.value)}
              className={cn("rounded-xl border px-3 py-2 text-xs font-medium transition-all",
                period === p.value ? "border-primary bg-primary/10 text-primary" : "border-gray-200 text-gray-500 hover:border-gray-300")}>
              {p.label}
            </button>
          ))}
          <button onClick={() => refetch()} className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:text-gray-700">
            <FiRefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {data && (
        <>
          {/* KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Visualizações", value: formatNum(data.kpis.pageViews), icon: FiEye, color: "bg-blue-100 text-blue-600", ...pctChange(data.kpis.pageViews, data.kpis.prevPageViews) },
              { label: "Cliques em Produtos", value: formatNum(data.kpis.productClicks), icon: FiMousePointer, color: "bg-purple-100 text-purple-600", ...pctChange(data.kpis.productClicks, data.kpis.prevProductClicks) },
              { label: "Pedidos", value: formatNum(data.kpis.orders), icon: FiShoppingCart, color: "bg-green-100 text-green-600", ...pctChange(data.kpis.orders, data.kpis.prevOrders) },
              { label: "Faturamento", value: formatBRL(data.kpis.revenue), icon: FiDollarSign, color: "bg-orange-100 text-orange-600", ...pctChange(data.kpis.revenue, data.kpis.prevRevenue) },
            ].map((kpi) => {
              const KIcon = kpi.icon;
              return (
                <div key={kpi.label} className="rounded-2xl border border-gray-100 bg-white p-5">
                  <div className="flex items-center justify-between">
                    <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", kpi.color)}>
                      <KIcon className="h-5 w-5" />
                    </div>
                    <span className={cn("flex items-center gap-0.5 text-xs font-semibold",
                      kpi.pctPositive ? "text-green-600" : "text-red-500")}>
                      {kpi.pctPositive ? <FiTrendingUp className="h-3 w-3" /> : <FiTrendingDown className="h-3 w-3" />}
                      {kpi.pctValue}
                    </span>
                  </div>
                  <p className="mt-3 text-2xl font-bold text-gray-900">{kpi.value}</p>
                  <p className="text-xs text-gray-400">{kpi.label}</p>
                </div>
              );
            })}
          </div>

          {/* Secondary KPIs */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 text-center">
              <FiUsers className="mx-auto h-5 w-5 text-gray-400" />
              <p className="mt-2 text-xl font-bold text-gray-900">{formatNum(data.kpis.uniqueVisitors)}</p>
              <p className="text-xs text-gray-400">Visitantes Únicos</p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 text-center">
              <FiTrendingUp className="mx-auto h-5 w-5 text-gray-400" />
              <p className="mt-2 text-xl font-bold text-gray-900">{data.kpis.conversionRate}%</p>
              <p className="text-xs text-gray-400">Taxa de Conversão</p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 text-center">
              <FiDollarSign className="mx-auto h-5 w-5 text-gray-400" />
              <p className="mt-2 text-xl font-bold text-gray-900">{formatBRL(data.kpis.avgOrderValue)}</p>
              <p className="text-xs text-gray-400">Ticket Médio</p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid gap-6 xl:grid-cols-2">
            {/* Daily Views Chart */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Visualizações Diárias</h3>
              {data.dailyViews.length > 0 ? (
                <div className="flex items-end gap-1 h-40">
                  {(() => {
                    const max = Math.max(...data.dailyViews.map((d) => d.views), 1);
                    return data.dailyViews.map((d, i) => (
                      <div key={i} className="group relative flex-1 flex flex-col items-center justify-end">
                        <div className="absolute -top-6 hidden group-hover:block rounded bg-gray-800 px-2 py-1 text-[10px] text-white whitespace-nowrap z-10">
                          {d.date.split("-").reverse().slice(0, 2).join("/")} — {d.views} views
                        </div>
                        <div
                          className="w-full max-w-[12px] rounded-t bg-blue-400 hover:bg-blue-500 transition-colors"
                          style={{ height: `${Math.max((d.views / max) * 100, 2)}%` }}
                        />
                      </div>
                    ));
                  })()}
                </div>
              ) : (
                <p className="text-center text-sm text-gray-400 py-10">Sem dados no período</p>
              )}
            </div>

            {/* Daily Revenue Chart */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Faturamento Diário</h3>
              {data.dailyOrders.length > 0 ? (
                <div className="flex items-end gap-1 h-40">
                  {(() => {
                    const max = Math.max(...data.dailyOrders.map((d) => d.revenue), 1);
                    return data.dailyOrders.map((d, i) => (
                      <div key={i} className="group relative flex-1 flex flex-col items-center justify-end">
                        <div className="absolute -top-6 hidden group-hover:block rounded bg-gray-800 px-2 py-1 text-[10px] text-white whitespace-nowrap z-10">
                          {d.date.split("-").reverse().slice(0, 2).join("/")} — {formatBRL(d.revenue)} ({d.orders} pedidos)
                        </div>
                        <div
                          className="w-full max-w-[12px] rounded-t bg-green-400 hover:bg-green-500 transition-colors"
                          style={{ height: `${Math.max((d.revenue / max) * 100, 2)}%` }}
                        />
                      </div>
                    ));
                  })()}
                </div>
              ) : (
                <p className="text-center text-sm text-gray-400 py-10">Sem dados no período</p>
              )}
            </div>
          </div>

          {/* Lists Row */}
          <div className="grid gap-6 xl:grid-cols-3">
            {/* Top Pages */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Páginas Mais Visitadas</h3>
              {data.topPages.length > 0 ? (
                <div className="space-y-2">
                  {data.topPages.map((p, i) => {
                    const maxViews = data.topPages[0]?.views || 1;
                    return (
                      <div key={i} className="relative overflow-hidden rounded-lg">
                        <div className="absolute inset-0 bg-blue-50 rounded-lg" style={{ width: `${(p.views / maxViews) * 100}%` }} />
                        <div className="relative flex items-center justify-between px-3 py-2">
                          <span className="text-xs font-medium text-gray-700 truncate max-w-[180px]">{p.page}</span>
                          <span className="text-xs font-bold text-gray-900">{formatNum(p.views)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-sm text-gray-400 py-6">Sem dados</p>
              )}
            </div>

            {/* Top Products */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Produtos Mais Clicados</h3>
              {data.topProducts.length > 0 ? (
                <div className="space-y-2">
                  {data.topProducts.map((p, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-lg p-2 hover:bg-gray-50">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gray-100 text-[10px] font-bold text-gray-500">{i + 1}</span>
                      {p.image ? (
                        <img src={p.image} alt="" className="h-8 w-8 rounded-lg object-cover" />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100"><FiPackage className="h-3 w-3 text-gray-400" /></div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-700 truncate">{p.name}</p>
                      </div>
                      <span className="text-xs font-bold text-gray-900">{formatNum(p.clicks)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-sm text-gray-400 py-6">Sem dados</p>
              )}
            </div>

            {/* Referrers */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Origem do Tráfego</h3>
              {data.referrers.length > 0 ? (
                <div className="space-y-2">
                  {data.referrers.map((r, i) => {
                    const maxCount = data.referrers[0]?.count || 1;
                    let displayRef = r.referrer;
                    try {
                      const u = new URL(r.referrer);
                      displayRef = u.hostname;
                    } catch {}
                    return (
                      <div key={i} className="relative overflow-hidden rounded-lg">
                        <div className="absolute inset-0 bg-purple-50 rounded-lg" style={{ width: `${(r.count / maxCount) * 100}%` }} />
                        <div className="relative flex items-center justify-between px-3 py-2">
                          <span className="flex items-center gap-1 text-xs font-medium text-gray-700 truncate max-w-[180px]">
                            <FiExternalLink className="h-3 w-3 shrink-0" /> {displayRef}
                          </span>
                          <span className="text-xs font-bold text-gray-900">{formatNum(r.count)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-sm text-gray-400 py-6">Sem dados</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
