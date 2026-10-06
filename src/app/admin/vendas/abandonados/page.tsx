"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import {
  FiSearch, FiX, FiRefreshCw, FiChevronLeft, FiChevronRight,
  FiShoppingBag, FiUser, FiCheck, FiClock, FiPackage, FiEye,
} from "react-icons/fi";

function formatBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}min atrás`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d atrás`;
  return `${Math.floor(days / 30)}m atrás`;
}

interface AbandonedCart {
  id: string;
  sessionId: string | null;
  total: number;
  recovered: boolean;
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string; email: string; phone: string | null } | null;
  items: {
    id: string;
    quantity: number;
    price: number;
    variant: string | null;
    product: { id: string; name: string; slug: string; images: { url: string }[] };
  }[];
}

function useAbandonedCarts(filters: { search?: string; recovered?: string; page?: number }) {
  return useQuery({
    queryKey: ["admin-abandoned-carts", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.search) params.set("search", filters.search);
      if (filters.recovered) params.set("recovered", filters.recovered);
      if (filters.page) params.set("page", String(filters.page));
      const res = await fetch(`/api/admin/abandoned-carts?${params}`);
      if (!res.ok) throw new Error("Erro ao buscar carrinhos");
      return res.json() as Promise<{ carts: AbandonedCart[]; total: number; page: number; totalPages: number }>;
    },
  });
}

export default function AbandonedCartsPage() {
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [recoveredFilter, setRecoveredFilter] = useState("");
  const [page, setPage] = useState(1);
  const [detailCart, setDetailCart] = useState<AbandonedCart | null>(null);

  const { data, isLoading, refetch } = useAbandonedCarts({
    search: searchDebounced, recovered: recoveredFilter, page,
  });

  const handleSearch = (val: string) => {
    setSearch(val);
    clearTimeout((window as any).__abSearchTimer);
    (window as any).__abSearchTimer = setTimeout(() => { setSearchDebounced(val); setPage(1); }, 400);
  };

  const carts = data?.carts || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Carrinhos Abandonados</h1>
        <p className="mt-0.5 text-sm text-gray-500">{total} carrinhos</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 lg:flex-row lg:items-center">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2">
          <FiSearch className="h-4 w-4 text-gray-400" />
          <input value={search} onChange={(e) => handleSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
            placeholder="Buscar por nome ou email..." />
          {search && <button onClick={() => { setSearch(""); setSearchDebounced(""); }}><FiX className="h-4 w-4 text-gray-400" /></button>}
        </div>

        <select value={recoveredFilter} onChange={(e) => { setRecoveredFilter(e.target.value); setPage(1); }}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none">
          <option value="">Todos</option>
          <option value="false">Abandonados</option>
          <option value="true">Recuperados</option>
        </select>

        <button onClick={() => refetch()} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:text-gray-700">
          <FiRefreshCw className="h-4 w-4" />
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {!isLoading && carts.length === 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white p-16 text-center">
          <FiShoppingBag className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-3 text-lg font-semibold text-gray-600">Nenhum carrinho abandonado</p>
          <p className="mt-1 text-sm text-gray-400">Os carrinhos abandonados aparecerão aqui</p>
        </div>
      )}

      {!isLoading && carts.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  <th className="px-5 py-3">Cliente</th>
                  <th className="px-5 py-3">Itens</th>
                  <th className="px-5 py-3">Total</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Abandonado há</th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {carts.map((cart) => (
                  <tr key={cart.id} className="border-b border-gray-50 transition-colors last:border-0 hover:bg-gray-50/50">
                    <td className="px-5 py-3">
                      {cart.user ? (
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                            {cart.user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{cart.user.name}</p>
                            <p className="text-[11px] text-gray-400">{cart.user.email}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-gray-400">
                          <FiUser className="h-4 w-4" />
                          <span className="text-xs">Visitante anônimo</span>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        {cart.items.slice(0, 3).map((item) => {
                          const img = item.product.images?.[0]?.url;
                          return img ? (
                            <img key={item.id} src={img} alt="" className="h-8 w-8 rounded-lg border border-gray-100 object-cover" />
                          ) : (
                            <div key={item.id} className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100">
                              <FiPackage className="h-3 w-3 text-gray-400" />
                            </div>
                          );
                        })}
                        {cart.items.length > 3 && (
                          <span className="ml-1 text-[10px] text-gray-400">+{cart.items.length - 3}</span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] text-gray-400">{cart.items.reduce((s, i) => s + i.quantity, 0)} produtos</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-sm font-semibold text-gray-900">{formatBRL(cart.total)}</span>
                    </td>
                    <td className="px-5 py-3">
                      {cart.recovered ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-600">
                          <FiCheck className="h-3 w-3" /> Recuperado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-orange-600">
                          <FiClock className="h-3 w-3" /> Abandonado
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs text-gray-400">{timeAgo(cart.updatedAt)}</span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => setDetailCart(cart)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 ml-auto">
                        <FiEye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
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

      {/* Detail Modal */}
      {detailCart && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-8 pb-8">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDetailCart(null)} />
          <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-lg font-bold text-gray-900">Carrinho Abandonado</h2>
              <button onClick={() => setDetailCart(null)} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
                <FiX className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {detailCart.user && (
                <div className="rounded-xl border border-gray-100 p-4">
                  <p className="text-xs font-semibold text-gray-400 mb-1">Cliente</p>
                  <p className="text-sm font-semibold text-gray-900">{detailCart.user.name}</p>
                  <p className="text-xs text-gray-500">{detailCart.user.email}</p>
                  {detailCart.user.phone && <p className="text-xs text-gray-500">{detailCart.user.phone}</p>}
                </div>
              )}

              <div>
                <p className="text-xs font-semibold text-gray-400 mb-2">Itens ({detailCart.items.length})</p>
                <div className="divide-y divide-gray-100 rounded-xl border border-gray-100">
                  {detailCart.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-3">
                      {item.product.images?.[0]?.url ? (
                        <img src={item.product.images[0].url} alt="" className="h-10 w-10 rounded-lg object-cover" />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100"><FiPackage className="h-4 w-4 text-gray-400" /></div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.product.name}</p>
                        {item.variant && <p className="text-[11px] text-gray-400">{item.variant}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">{formatBRL(item.price * item.quantity)}</p>
                        <p className="text-[10px] text-gray-400">{item.quantity}x {formatBRL(item.price)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between rounded-xl bg-gray-50 p-4">
                <span className="text-sm font-semibold text-gray-700">Total do carrinho</span>
                <span className="text-lg font-bold text-gray-900">{formatBRL(detailCart.total)}</span>
              </div>

              <p className="text-center text-xs text-gray-400">Abandonado {timeAgo(detailCart.updatedAt)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
