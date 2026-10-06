"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import {
  FiSearch, FiX, FiRefreshCw, FiChevronLeft, FiChevronRight,
  FiCreditCard, FiDollarSign, FiCheck, FiClock, FiAlertTriangle,
  FiCopy, FiTrendingUp,
} from "react-icons/fi";

function formatBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function formatDateTime(d: string) {
  return new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

interface Transaction {
  id: string;
  orderNumber: string;
  paymentMethod: string | null;
  paymentStatus: string;
  paymentId: string | null;
  total: number;
  subtotal: number;
  shipping: number;
  discount: number;
  status: string;
  createdAt: string;
  user: { id: string; name: string; email: string };
}

const paymentStatusMap: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: "Pendente", color: "bg-yellow-50 text-yellow-700", icon: FiClock },
  CONFIRMED: { label: "Confirmado", color: "bg-green-50 text-green-700", icon: FiCheck },
  FAILED: { label: "Falhou", color: "bg-red-50 text-red-700", icon: FiAlertTriangle },
  REFUNDED: { label: "Reembolsado", color: "bg-gray-100 text-gray-600", icon: FiX },
  CANCELLED: { label: "Cancelado", color: "bg-red-50 text-red-500", icon: FiX },
};

const methodLabels: Record<string, { label: string; color: string }> = {
  PIX: { label: "PIX", color: "bg-teal-50 text-teal-700" },
  BOLETO: { label: "Boleto", color: "bg-blue-50 text-blue-700" },
  CREDIT_CARD: { label: "Cartão", color: "bg-purple-50 text-purple-700" },
  WALLET: { label: "Carteira", color: "bg-amber-50 text-amber-700" },
};

function useTransactions(filters: any) {
  return useQuery({
    queryKey: ["admin-transactions", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, String(v)); });
      const res = await fetch(`/api/admin/transactions?${params}`);
      if (!res.ok) throw new Error("Erro ao buscar transações");
      return res.json() as Promise<{
        transactions: Transaction[]; total: number; page: number; totalPages: number;
        confirmedTotal: number; confirmedCount: number;
      }>;
    },
  });
}

export default function TransactionsPage() {
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, refetch } = useTransactions({
    search: searchDebounced, paymentStatus, paymentMethod, dateFrom, dateTo, page,
  });

  const handleSearch = (val: string) => {
    setSearch(val);
    clearTimeout((window as any).__txSearchTimer);
    (window as any).__txSearchTimer = setTimeout(() => { setSearchDebounced(val); setPage(1); }, 400);
  };

  const transactions = data?.transactions || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Transações</h1>
        <p className="mt-0.5 text-sm text-gray-500">{total} transações</p>
      </div>

      {/* KPIs */}
      {data && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-gray-100 bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
                <FiTrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Total Confirmado</p>
                <p className="text-xl font-bold text-gray-900">{formatBRL(data.confirmedTotal)}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                <FiCreditCard className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Pagamentos Confirmados</p>
                <p className="text-xl font-bold text-gray-900">{data.confirmedCount}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 xl:flex-row xl:items-center">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2">
          <FiSearch className="h-4 w-4 text-gray-400" />
          <input value={search} onChange={(e) => handleSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
            placeholder="Buscar por nº pedido, ID pagamento ou nome..." />
          {search && <button onClick={() => { setSearch(""); setSearchDebounced(""); }}><FiX className="h-4 w-4 text-gray-400" /></button>}
        </div>

        <select value={paymentStatus} onChange={(e) => { setPaymentStatus(e.target.value); setPage(1); }}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none">
          <option value="">Status Pgto</option>
          <option value="PENDING">Pendente</option>
          <option value="CONFIRMED">Confirmado</option>
          <option value="FAILED">Falhou</option>
          <option value="REFUNDED">Reembolsado</option>
        </select>

        <select value={paymentMethod} onChange={(e) => { setPaymentMethod(e.target.value); setPage(1); }}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none">
          <option value="">Método</option>
          <option value="PIX">PIX</option>
          <option value="BOLETO">Boleto</option>
          <option value="CREDIT_CARD">Cartão</option>
          <option value="WALLET">Carteira</option>
        </select>

        <div className="flex items-center gap-2">
          <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none" />
          <span className="text-xs text-gray-400">até</span>
          <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none" />
        </div>

        <button onClick={() => refetch()} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:text-gray-700">
          <FiRefreshCw className="h-4 w-4" />
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {!isLoading && transactions.length === 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white p-16 text-center">
          <FiCreditCard className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-3 text-lg font-semibold text-gray-600">Nenhuma transação encontrada</p>
          <p className="mt-1 text-sm text-gray-400">As transações aparecerão aqui conforme os pagamentos forem processados</p>
        </div>
      )}

      {!isLoading && transactions.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  <th className="px-5 py-3">Pedido</th>
                  <th className="px-5 py-3">Cliente</th>
                  <th className="px-5 py-3">Método</th>
                  <th className="px-5 py-3">Valor</th>
                  <th className="px-5 py-3">Status Pgto</th>
                  <th className="px-5 py-3">ID Pagamento</th>
                  <th className="px-5 py-3">Data</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const ps = paymentStatusMap[tx.paymentStatus] || paymentStatusMap.PENDING;
                  const PsIcon = ps.icon;
                  const mt = methodLabels[tx.paymentMethod || ""] || { label: "—", color: "bg-gray-50 text-gray-500" };
                  return (
                    <tr key={tx.id} className="border-b border-gray-50 transition-colors last:border-0 hover:bg-gray-50/50">
                      <td className="px-5 py-3">
                        <code className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-bold text-gray-700">#{tx.orderNumber}</code>
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-sm font-medium text-gray-900 truncate max-w-[140px]">{tx.user.name}</p>
                        <p className="text-[11px] text-gray-400 truncate max-w-[140px]">{tx.user.email}</p>
                      </td>
                      <td className="px-5 py-3">
                        <span className={cn("inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold", mt.color)}>
                          {mt.label}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-sm font-semibold text-gray-900">{formatBRL(tx.total)}</p>
                        {tx.discount > 0 && <p className="text-[10px] text-green-600">-{formatBRL(tx.discount)} desc.</p>}
                      </td>
                      <td className="px-5 py-3">
                        <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold", ps.color)}>
                          <PsIcon className="h-3 w-3" /> {ps.label}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {tx.paymentId ? (
                          <div className="flex items-center gap-1">
                            <code className="text-[11px] text-gray-500 truncate max-w-[120px]">{tx.paymentId}</code>
                            <button onClick={() => navigator.clipboard.writeText(tx.paymentId!)} className="text-gray-300 hover:text-gray-500">
                              <FiCopy className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs text-gray-400">{formatDateTime(tx.createdAt)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4">
          <p className="text-xs text-gray-500">
            Mostrando <strong>{(page - 1) * 20 + 1}</strong>–<strong>{Math.min(page * 20, total)}</strong> de <strong>{total}</strong>
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50">
              <FiChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const pn = page <= 3 ? i + 1 : page + i - 2;
              if (pn < 1 || pn > totalPages) return null;
              return (
                <button key={pn} onClick={() => setPage(pn)}
                  className={cn("flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium", page === pn ? "bg-primary text-white" : "text-gray-500 hover:bg-gray-50")}>
                  {pn}
                </button>
              );
            })}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50">
              <FiChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
