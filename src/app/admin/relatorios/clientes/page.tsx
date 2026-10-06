"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import {
  FiUsers, FiRefreshCw, FiTrendingUp, FiTrendingDown,
  FiDollarSign, FiUserCheck, FiShoppingCart, FiMapPin,
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

const currentYear = new Date().getFullYear();
const periods = [
  { value: "7d", label: "7 dias" }, { value: "30d", label: "30 dias" },
  { value: "90d", label: "90 dias" }, { value: "365d", label: "1 ano" },
  ...Array.from({ length: currentYear - 2023 + 1 }, (_, i) => {
    const year = 2023 + i;
    return { value: String(year), label: String(year) };
  }),
  { value: "all", label: "Tudo" },
];

function useClientsReport(period: string) {
  return useQuery({
    queryKey: ["admin-reports-clients", period],
    queryFn: async () => {
      const res = await fetch(`/api/admin/reports/clients?period=${period}`);
      if (!res.ok) throw new Error("Erro");
      return res.json();
    },
  });
}

export default function ClientsReportPage() {
  const [period, setPeriod] = useState("30d");
  const { data, isLoading, refetch } = useClientsReport(period);

  const clientPct = data ? pctChange(data.kpis.newClients, data.kpis.prevNewClients) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatório de Clientes</h1>
          <p className="mt-0.5 text-sm text-gray-500">Novos cadastros, distribuição geográfica e top compradores</p>
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
          {/* KPIs */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-gray-100 bg-white p-5">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600"><FiUsers className="h-5 w-5" /></div>
                {clientPct && (
                  <span className={cn("flex items-center gap-0.5 text-xs font-semibold", clientPct.pctPositive ? "text-green-600" : "text-red-500")}>
                    {clientPct.pctPositive ? <FiTrendingUp className="h-3 w-3" /> : <FiTrendingDown className="h-3 w-3" />}
                    {clientPct.pctValue}
                  </span>
                )}
              </div>
              <p className="mt-3 text-2xl font-bold text-gray-900">{formatNum(data.kpis.newClients)}</p>
              <p className="text-xs text-gray-400">Novos Clientes</p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-600"><FiUserCheck className="h-5 w-5" /></div>
              <p className="mt-3 text-2xl font-bold text-gray-900">{formatNum(data.kpis.totalClients)}</p>
              <p className="text-xs text-gray-400">Total de Clientes</p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600"><FiShoppingCart className="h-5 w-5" /></div>
              <p className="mt-3 text-2xl font-bold text-gray-900">{data.kpis.conversionRate}%</p>
              <p className="text-xs text-gray-400">Taxa de Conversão (cadastros → compras)</p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600"><FiDollarSign className="h-5 w-5" /></div>
              <p className="mt-3 text-2xl font-bold text-gray-900">{formatBRL(data.kpis.ltv)}</p>
              <p className="text-xs text-gray-400">LTV Médio (Lifetime Value)</p>
            </div>
          </div>

          {/* New Clients Chart */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Novos Cadastros por Dia</h3>
            {data.newClientsDaily.length > 0 ? (
              <div className="flex items-end gap-1 h-40">
                {(() => {
                  const max = Math.max(...data.newClientsDaily.map((d: any) => d.count), 1);
                  return data.newClientsDaily.map((d: any, i: number) => (
                    <div key={i} className="group relative flex-1 flex flex-col items-center justify-end">
                      <div className="absolute -top-6 hidden group-hover:block rounded bg-gray-800 px-2 py-1 text-[10px] text-white whitespace-nowrap z-10">
                        {d.date.split("-").reverse().slice(0, 2).join("/")} — {d.count} novos
                      </div>
                      <div className="w-full max-w-[12px] rounded-t bg-blue-400 hover:bg-blue-500 transition-colors"
                        style={{ height: `${Math.max((d.count / max) * 100, 4)}%` }} />
                    </div>
                  ));
                })()}
              </div>
            ) : <p className="text-center text-sm text-gray-400 py-10">Sem dados no período</p>}
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            {/* Top Buyers */}
            <div className="xl:col-span-2 rounded-2xl border border-gray-100 bg-white p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Top Compradores</h3>
              {data.topBuyers.length > 0 ? (
                <div className="space-y-2">
                  {data.topBuyers.map((b: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-gray-50">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-[11px] font-bold text-primary">{i + 1}</span>
                      {b.avatar ? (
                        <img src={b.avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">
                          {b.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900 truncate">{b.name}</p>
                        <p className="text-[10px] text-gray-400">{b.email} · {b.orderCount} pedidos</p>
                      </div>
                      <span className="text-sm font-bold text-gray-900">{formatBRL(b.totalPurchases)}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-center text-sm text-gray-400 py-8">Sem dados</p>}
            </div>

            {/* Geographic Distribution */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5">
              <div className="flex items-center gap-2 mb-4">
                <FiMapPin className="h-4 w-4 text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-900">Distribuição Geográfica</h3>
              </div>

              {data.stateDistribution.length > 0 && (
                <div className="mb-4">
                  <p className="text-[11px] font-semibold text-gray-400 mb-2">Por Estado</p>
                  <div className="space-y-1.5">
                    {data.stateDistribution.map((s: any, i: number) => {
                      const max = data.stateDistribution[0]?.count || 1;
                      return (
                        <div key={i} className="relative overflow-hidden rounded-lg">
                          <div className="absolute inset-0 bg-primary/5 rounded-lg" style={{ width: `${(s.count / max) * 100}%` }} />
                          <div className="relative flex items-center justify-between px-3 py-1.5">
                            <span className="text-xs font-medium text-gray-700">{s.state}</span>
                            <span className="text-xs font-bold text-gray-900">{s.count}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {data.cityDistribution.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 mb-2">Por Cidade</p>
                  <div className="space-y-1.5">
                    {data.cityDistribution.map((c: any, i: number) => {
                      const max = data.cityDistribution[0]?.count || 1;
                      return (
                        <div key={i} className="relative overflow-hidden rounded-lg">
                          <div className="absolute inset-0 bg-blue-50 rounded-lg" style={{ width: `${(c.count / max) * 100}%` }} />
                          <div className="relative flex items-center justify-between px-3 py-1.5">
                            <span className="text-xs font-medium text-gray-700">{c.city}</span>
                            <span className="text-xs font-bold text-gray-900">{c.count}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {data.stateDistribution.length === 0 && data.cityDistribution.length === 0 && (
                <p className="text-center text-sm text-gray-400 py-6">Sem dados de localização</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
