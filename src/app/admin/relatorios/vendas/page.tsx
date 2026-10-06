"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import {
  FiShoppingCart, FiDollarSign, FiCheck, FiX, FiRefreshCw,
  FiTruck, FiCreditCard, FiPercent, FiTag,
} from "react-icons/fi";

function formatBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function formatNum(v: number) {
  return v.toLocaleString("pt-BR");
}

const statusLabels: Record<string, string> = {
  PENDING: "Pendente", AWAITING_PAYMENT: "Aguardando Pgto", PAYMENT_CONFIRMED: "Pago",
  PROCESSING: "Processando", SHIPPED: "Enviado", DELIVERED: "Entregue",
  CANCELLED: "Cancelado", REFUNDED: "Reembolsado",
  MISSING_LABEL: "Sem Etiqueta", ORDER_ERROR: "Erro no Pedido",
};

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-400", AWAITING_PAYMENT: "bg-orange-400", PAYMENT_CONFIRMED: "bg-blue-400",
  PROCESSING: "bg-indigo-400", SHIPPED: "bg-purple-400", DELIVERED: "bg-green-400",
  CANCELLED: "bg-red-400", REFUNDED: "bg-gray-400",
  MISSING_LABEL: "bg-amber-500", ORDER_ERROR: "bg-red-600",
};

const methodLabels: Record<string, string> = { PIX: "PIX", BOLETO: "Boleto", CREDIT_CARD: "Cartão", WALLET: "Carteira" };

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

function useSalesReport(period: string) {
  return useQuery({
    queryKey: ["admin-reports-sales", period],
    queryFn: async () => {
      const res = await fetch(`/api/admin/reports/sales?period=${period}`);
      if (!res.ok) throw new Error("Erro");
      return res.json();
    },
  });
}

export default function SalesReportPage() {
  const [period, setPeriod] = useState("30d");
  const { data, isLoading, refetch } = useSalesReport(period);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatório de Vendas</h1>
          <p className="mt-0.5 text-sm text-gray-500">Detalhamento de faturamento, pedidos e pagamentos</p>
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
            {[
              { label: "Faturamento", value: formatBRL(data.kpis.revenue), icon: FiDollarSign, color: "bg-green-100 text-green-600" },
              { label: "Total Pedidos", value: formatNum(data.kpis.totalOrders), icon: FiShoppingCart, color: "bg-blue-100 text-blue-600" },
              { label: "Pedidos Confirmados", value: formatNum(data.kpis.confirmedOrders), icon: FiCheck, color: "bg-emerald-100 text-emerald-600" },
              { label: "Ticket Médio", value: formatBRL(data.kpis.avgOrderValue), icon: FiDollarSign, color: "bg-orange-100 text-orange-600" },
            ].map((kpi) => {
              const KIcon = kpi.icon;
              return (
                <div key={kpi.label} className="rounded-2xl border border-gray-100 bg-white p-5">
                  <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", kpi.color)}>
                    <KIcon className="h-5 w-5" />
                  </div>
                  <p className="mt-3 text-2xl font-bold text-gray-900">{kpi.value}</p>
                  <p className="text-xs text-gray-400">{kpi.label}</p>
                </div>
              );
            })}
          </div>

          {/* Extra KPIs */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 text-center">
              <FiPercent className="mx-auto h-5 w-5 text-gray-400" />
              <p className="mt-2 text-xl font-bold text-red-600">{formatBRL(data.kpis.totalDiscount)}</p>
              <p className="text-xs text-gray-400">Total em Descontos</p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 text-center">
              <FiTruck className="mx-auto h-5 w-5 text-gray-400" />
              <p className="mt-2 text-xl font-bold text-gray-900">{formatBRL(data.kpis.totalShipping)}</p>
              <p className="text-xs text-gray-400">Total em Frete</p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-5 text-center">
              <FiX className="mx-auto h-5 w-5 text-gray-400" />
              <p className="mt-2 text-xl font-bold text-gray-900">{formatNum(data.kpis.cancelledOrders)}</p>
              <p className="text-xs text-gray-400">Pedidos Cancelados</p>
            </div>
          </div>

          {/* Daily Revenue Chart */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Faturamento Diário</h3>
            {data.dailyData.length > 0 ? (
              <div className="flex items-end gap-1 h-48">
                {(() => {
                  const max = Math.max(...data.dailyData.map((d: any) => d.confirmedRevenue), 1);
                  return data.dailyData.map((d: any, i: number) => (
                    <div key={i} className="group relative flex-1 flex flex-col items-center justify-end">
                      <div className="absolute -top-8 hidden group-hover:block rounded bg-gray-800 px-2 py-1 text-[10px] text-white whitespace-nowrap z-10">
                        {d.date.split("-").reverse().slice(0, 2).join("/")} — {formatBRL(d.confirmedRevenue)} ({d.orders} ped.)
                      </div>
                      <div className="w-full max-w-[14px] rounded-t bg-green-400 hover:bg-green-500 transition-colors"
                        style={{ height: `${Math.max((d.confirmedRevenue / max) * 100, 2)}%` }} />
                    </div>
                  ));
                })()}
              </div>
            ) : <p className="text-center text-sm text-gray-400 py-10">Sem dados no período</p>}
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            {/* Payment Methods */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Métodos de Pagamento</h3>
              {data.paymentMethods.length > 0 ? (
                <div className="space-y-3">
                  {data.paymentMethods.map((m: any, i: number) => {
                    const totalAll = data.paymentMethods.reduce((s: number, x: any) => s + x.count, 0);
                    const pct = totalAll > 0 ? Math.round((m.count / totalAll) * 100) : 0;
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-gray-700">{methodLabels[m.method] || m.method}</span>
                          <span className="text-xs text-gray-500">{m.count} ({pct}%)</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-gray-100">
                          <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <p className="mt-0.5 text-[11px] text-gray-400">{formatBRL(m.total)}</p>
                      </div>
                    );
                  })}
                </div>
              ) : <p className="text-center text-sm text-gray-400 py-6">Sem dados</p>}
            </div>

            {/* Status Breakdown */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Status dos Pedidos</h3>
              {data.statusBreakdown.length > 0 ? (
                <div className="space-y-2">
                  {data.statusBreakdown.map((s: any, i: number) => (
                    <div key={i} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-gray-50">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className={cn("h-2.5 w-2.5 rounded-full", statusColors[s.status] || "bg-gray-300")} />
                        <span className="text-xs font-medium text-gray-700">{statusLabels[s.status] || s.status}</span>
                      </div>
                      <span className="text-xs font-bold text-gray-900">{s.count}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-center text-sm text-gray-400 py-6">Sem dados</p>}
            </div>

            {/* Coupon Usage */}
            <div className="rounded-2xl border border-gray-100 bg-white p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Uso de Cupons</h3>
              {data.couponUsage.length > 0 ? (
                <div className="space-y-2">
                  {data.couponUsage.map((c: any, i: number) => (
                    <div key={i} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-gray-50">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <FiTag className="h-3 w-3 text-gray-400" />
                          <code className="text-xs font-bold text-gray-700">{c.code}</code>
                        </div>
                        {c.name && <p className="text-[10px] text-gray-400 mt-0.5">{c.name}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-gray-900">{c.usageCount}x</p>
                        <p className="text-[10px] text-red-500">-{formatBRL(c.totalDiscount)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-center text-sm text-gray-400 py-6">Nenhum cupom usado</p>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
