"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import {
  FiPackage, FiRefreshCw, FiTrendingUp, FiTrendingDown, FiMousePointer,
  FiEye, FiAlertTriangle, FiChevronLeft, FiChevronRight,
} from "react-icons/fi";

function formatBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function formatNum(v: number) {
  return v.toLocaleString("pt-BR");
}

const PAGE_SIZE = 15;

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

function useProductsReport(period: string, topSellingPage: number, lowStockPage: number, leastSellingPage: number) {
  return useQuery({
    queryKey: ["admin-reports-products", period, topSellingPage, lowStockPage, leastSellingPage],
    queryFn: async () => {
      const params = new URLSearchParams({
        period,
        topSellingPage: String(topSellingPage),
        lowStockPage: String(lowStockPage),
        leastSellingPage: String(leastSellingPage),
      });
      const res = await fetch(`/api/admin/reports/products?${params}`);
      if (!res.ok) throw new Error("Erro");
      return res.json();
    },
  });
}

export default function ProductsReportPage() {
  const [period, setPeriod] = useState("30d");
  const [topSellingPage, setTopSellingPage] = useState(1);
  const [lowStockPage, setLowStockPage] = useState(1);
  const [leastSellingPage, setLeastSellingPage] = useState(1);
  const { data, isLoading, refetch } = useProductsReport(period, topSellingPage, lowStockPage, leastSellingPage);

  const topSellingTotalPages = data ? Math.ceil(data.topSellingTotal / PAGE_SIZE) : 1;
  const lowStockTotalPages = data ? Math.ceil(data.lowStockTotal / PAGE_SIZE) : 1;
  const leastSellingTotalPages = data ? Math.ceil(data.leastSellingTotal / PAGE_SIZE) : 1;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatório de Produtos</h1>
          <p className="mt-0.5 text-sm text-gray-500">Mais vendidos, menos vendidos, mais clicados e estoque baixo</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {periods.map((p) => (
            <button key={p.value} onClick={() => { setPeriod(p.value); setTopSellingPage(1); setLowStockPage(1); setLeastSellingPage(1); }}
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
        <div className="grid gap-6 xl:grid-cols-2">
          {/* Top Selling */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5">
            <div className="flex items-center gap-2 mb-4">
              <FiTrendingUp className="h-4 w-4 text-green-500" />
              <h3 className="text-sm font-semibold text-gray-900">Mais Vendidos</h3>
            </div>
            {data.topSelling.length > 0 ? (
              <>
                <div className="space-y-2">
                  {data.topSelling.map((p: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-gray-50">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-green-50 text-[11px] font-bold text-green-600">
                        {(topSellingPage - 1) * PAGE_SIZE + i + 1}
                      </span>
                      {p.image ? (
                        <img src={p.image} alt="" className="h-10 w-10 rounded-lg object-cover" />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100"><FiPackage className="h-4 w-4 text-gray-400" /></div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900 truncate">{p.name}</p>
                        <p className="text-[10px] text-gray-400">{p.orders} pedidos · {p.quantity} un.</p>
                      </div>
                      <span className="text-sm font-bold text-gray-900">{formatBRL(p.revenue)}</span>
                    </div>
                  ))}
                </div>
                {topSellingTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => setTopSellingPage((p) => Math.max(1, p - 1))}
                      disabled={topSellingPage === 1}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <FiChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-xs text-gray-500">
                      {topSellingPage} de {topSellingTotalPages}
                    </span>
                    <button
                      onClick={() => setTopSellingPage((p) => Math.min(topSellingTotalPages, p + 1))}
                      disabled={topSellingPage === topSellingTotalPages}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <FiChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </>
            ) : <p className="text-center text-sm text-gray-400 py-8">Sem vendas no período</p>}
          </div>

          {/* Least Selling */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5">
            <div className="flex items-center gap-2 mb-4">
              <FiTrendingDown className="h-4 w-4 text-red-500" />
              <h3 className="text-sm font-semibold text-gray-900">Menos Vendidos</h3>
            </div>
            {data.leastSelling.length > 0 ? (
              <>
                <div className="space-y-2">
                  {data.leastSelling.map((p: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-gray-50">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-50 text-[11px] font-bold text-red-600">
                        {(leastSellingPage - 1) * PAGE_SIZE + i + 1}
                      </span>
                      {p.image ? (
                        <img src={p.image} alt="" className="h-10 w-10 rounded-lg object-cover" />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100"><FiPackage className="h-4 w-4 text-gray-400" /></div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900 truncate">{p.name}</p>
                        <p className="text-[10px] text-gray-400">
                          {p.quantity > 0 ? `${p.quantity} un. vendidas` : "Nenhuma venda"}
                        </p>
                      </div>
                      <span className="text-sm font-bold text-gray-900">{formatBRL(p.revenue)}</span>
                    </div>
                  ))}
                </div>
                {leastSellingTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => setLeastSellingPage((p) => Math.max(1, p - 1))}
                      disabled={leastSellingPage === 1}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <FiChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-xs text-gray-500">
                      {leastSellingPage} de {leastSellingTotalPages}
                    </span>
                    <button
                      onClick={() => setLeastSellingPage((p) => Math.min(leastSellingTotalPages, p + 1))}
                      disabled={leastSellingPage === leastSellingTotalPages}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <FiChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </>
            ) : <p className="text-center text-sm text-gray-400 py-8">Nenhum produto ativo</p>}
          </div>

          {/* Top Clicked */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5">
            <div className="flex items-center gap-2 mb-4">
              <FiMousePointer className="h-4 w-4 text-purple-500" />
              <h3 className="text-sm font-semibold text-gray-900">Mais Clicados</h3>
            </div>
            {data.topClicked.length > 0 ? (
              <div className="space-y-2">
                {data.topClicked.map((p: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-gray-50">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-50 text-[11px] font-bold text-purple-600">{i + 1}</span>
                    {p.image ? (
                      <img src={p.image} alt="" className="h-10 w-10 rounded-lg object-cover" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100"><FiPackage className="h-4 w-4 text-gray-400" /></div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 truncate">{p.name}</p>
                      <p className="text-[10px] text-gray-400">{formatBRL(p.price)}</p>
                    </div>
                    <span className="text-sm font-bold text-purple-600">{formatNum(p.clicks)} cliques</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-center text-sm text-gray-400 py-8">Sem cliques no período</p>}
          </div>

          {/* Top Viewed Product Pages */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5">
            <div className="flex items-center gap-2 mb-4">
              <FiEye className="h-4 w-4 text-blue-500" />
              <h3 className="text-sm font-semibold text-gray-900">Páginas de Produto Mais Visitadas</h3>
            </div>
            {data.topViewed.length > 0 ? (
              <div className="space-y-2">
                {data.topViewed.map((p: any, i: number) => {
                  const maxV = data.topViewed[0]?.views || 1;
                  return (
                    <div key={i} className="relative overflow-hidden rounded-lg">
                      <div className="absolute inset-0 bg-blue-50 rounded-lg" style={{ width: `${(p.views / maxV) * 100}%` }} />
                      <div className="relative flex items-center justify-between px-3 py-2.5">
                        <span className="text-xs font-medium text-gray-700 truncate max-w-[200px]">{p.slug}</span>
                        <span className="text-xs font-bold text-gray-900">{formatNum(p.views)} views</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : <p className="text-center text-sm text-gray-400 py-8">Sem dados</p>}
          </div>

          {/* Low Stock Alert */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5">
            <div className="flex items-center gap-2 mb-4">
              <FiAlertTriangle className="h-4 w-4 text-orange-500" />
              <h3 className="text-sm font-semibold text-gray-900">Estoque Baixo</h3>
            </div>
            {data.lowStock.length > 0 ? (
              <>
                <div className="space-y-2">
                  {data.lowStock.map((p: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-gray-50">
                      {p.images?.[0]?.url ? (
                        <img src={p.images[0].url} alt="" className="h-10 w-10 rounded-lg object-cover" />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100"><FiPackage className="h-4 w-4 text-gray-400" /></div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900 truncate">{p.name}</p>
                        {p.sku && <p className="text-[10px] text-gray-400 font-mono">{p.sku}</p>}
                      </div>
                      <span className={cn("text-sm font-bold", p.stock === 0 ? "text-red-600" : "text-orange-600")}>
                        {p.stock === 0 ? "Esgotado" : `${p.stock} un.`}
                      </span>
                    </div>
                  ))}
                </div>
                {lowStockTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => setLowStockPage((p) => Math.max(1, p - 1))}
                      disabled={lowStockPage === 1}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <FiChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-xs text-gray-500">
                      {lowStockPage} de {lowStockTotalPages}
                    </span>
                    <button
                      onClick={() => setLowStockPage((p) => Math.min(lowStockTotalPages, p + 1))}
                      disabled={lowStockPage === lowStockTotalPages}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <FiChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </>
            ) : <p className="text-center text-sm text-gray-400 py-8">Todo estoque OK</p>}
          </div>
        </div>
      )}
    </div>
  );
}
