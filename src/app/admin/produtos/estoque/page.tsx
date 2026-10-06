"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FiSearch, FiX, FiRefreshCw, FiChevronLeft, FiChevronRight,
  FiDatabase, FiAlertTriangle, FiPackage, FiCheck, FiEdit3,
  FiSave, FiXCircle,
} from "react-icons/fi";

function formatBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

interface StockProduct {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  slug: string;
  stock: number;
  lowStockAlert: number;
  manageStock: boolean;
  price: number;
  active: boolean;
  images: { url: string }[];
  categories: { category: { name: string } }[];
  variants: { id: string; name: string; value: string; stock: number; sku: string | null }[];
}

interface StockStats {
  totalProducts: number;
  totalUnits: number;
  outOfStock: number;
  lowStock: number;
}

function useStock(filters: any) {
  return useQuery({
    queryKey: ["admin-stock", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, String(v)); });
      const res = await fetch(`/api/admin/stock?${params}`);
      if (!res.ok) throw new Error("Erro ao buscar estoque");
      return res.json() as Promise<{
        products: StockProduct[]; total: number; page: number; totalPages: number; stats: StockStats;
      }>;
    },
  });
}

function useUpdateStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, stock, lowStockAlert }: { id: string; stock?: number; lowStockAlert?: number }) => {
      const res = await fetch(`/api/admin/stock/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock, lowStockAlert }),
      });
      if (!res.ok) throw new Error("Erro ao atualizar estoque");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-stock"] }),
  });
}

export default function StockPage() {
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [stockFilter, setStockFilter] = useState("");
  const [sortBy, setSortBy] = useState("stock");
  const [sortOrder, setSortOrder] = useState("asc");
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStock, setEditStock] = useState("");
  const [editAlert, setEditAlert] = useState("");

  const PAGE_SIZE = 10;
  const { data, isLoading, refetch } = useStock({
    search: searchDebounced, stockFilter, sort: sortBy, order: sortOrder, page, limit: PAGE_SIZE,
  });

  const updateMut = useUpdateStock();

  const handleSearch = (val: string) => {
    setSearch(val);
    clearTimeout((window as any).__stockSearchTimer);
    (window as any).__stockSearchTimer = setTimeout(() => { setSearchDebounced(val); setPage(1); }, 400);
  };

  const startEdit = (p: StockProduct) => {
    setEditingId(p.id);
    setEditStock(String(p.stock));
    setEditAlert(String(p.lowStockAlert));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditStock("");
    setEditAlert("");
  };

  const saveEdit = async (id: string) => {
    try {
      await updateMut.mutateAsync({
        id,
        stock: parseInt(editStock),
        lowStockAlert: parseInt(editAlert),
      });
      cancelEdit();
    } catch {}
  };

  const products = data?.products || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;
  const stats = data?.stats;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Controle de Estoque</h1>
        <p className="mt-0.5 text-sm text-gray-500">{total} produtos com estoque gerenciado</p>
      </div>

      {/* KPI Cards */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                <FiDatabase className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Total Unidades</p>
                <p className="text-xl font-bold text-gray-900">{stats.totalUnits.toLocaleString("pt-BR")}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
                <FiCheck className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Produtos</p>
                <p className="text-xl font-bold text-gray-900">{stats.totalProducts}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 cursor-pointer hover:border-orange-200" onClick={() => { setStockFilter("low"); setPage(1); }}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100">
                <FiAlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Estoque Baixo</p>
                <p className="text-xl font-bold text-orange-600">{stats.lowStock}</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 cursor-pointer hover:border-red-200" onClick={() => { setStockFilter("out"); setPage(1); }}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
                <FiXCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Sem Estoque</p>
                <p className="text-xl font-bold text-red-600">{stats.outOfStock}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 lg:flex-row lg:items-center">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2">
          <FiSearch className="h-4 w-4 text-gray-400" />
          <input value={search} onChange={(e) => handleSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
            placeholder="Buscar por nome, SKU ou código de barras..." />
          {search && <button onClick={() => { setSearch(""); setSearchDebounced(""); }}><FiX className="h-4 w-4 text-gray-400" /></button>}
        </div>

        <div className="flex items-center gap-2">
          {[
            { val: "", label: "Todos" },
            { val: "out", label: "Sem estoque" },
            { val: "low", label: "Estoque baixo" },
            { val: "ok", label: "OK" },
          ].map((f) => (
            <button key={f.val} onClick={() => { setStockFilter(f.val); setPage(1); }}
              className={cn("rounded-xl border px-3 py-2 text-xs font-medium transition-all",
                stockFilter === f.val ? "border-primary bg-primary/10 text-primary" : "border-gray-200 text-gray-500 hover:border-gray-300")}>
              {f.label}
            </button>
          ))}
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

      {!isLoading && products.length === 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white p-16 text-center">
          <FiDatabase className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-3 text-lg font-semibold text-gray-600">Nenhum produto encontrado</p>
        </div>
      )}

      {!isLoading && products.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  <th className="px-5 py-3">Produto</th>
                  <th className="px-5 py-3">SKU</th>
                  <th className="px-5 py-3">Preço</th>
                  <th className="px-5 py-3 cursor-pointer hover:text-gray-600"
                    onClick={() => { setSortBy("stock"); setSortOrder(sortBy === "stock" && sortOrder === "asc" ? "desc" : "asc"); setPage(1); }}>
                    Estoque {sortBy === "stock" && (sortOrder === "asc" ? "↑" : "↓")}
                  </th>
                  <th className="px-5 py-3">Alerta</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const isOut = p.stock === 0;
                  const isLow = p.stock > 0 && p.stock <= p.lowStockAlert;
                  const isEditing = editingId === p.id;
                  const img = p.images?.[0]?.url;
                  const catName = p.categories?.[0]?.category?.name;

                  return (
                    <tr key={p.id} className={cn("border-b border-gray-50 transition-colors last:border-0 hover:bg-gray-50/50", isOut && "bg-red-50/30")}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          {img ? (
                            <img src={img} alt="" className="h-9 w-9 rounded-lg object-cover" />
                          ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100">
                              <FiPackage className="h-4 w-4 text-gray-400" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{p.name}</p>
                            {catName && <p className="text-[10px] text-gray-400">{catName}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs text-gray-500 font-mono">{p.sku || "—"}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-sm font-semibold text-gray-900">{formatBRL(p.price)}</span>
                      </td>
                      <td className="px-5 py-3">
                        {isEditing ? (
                          <input type="number" value={editStock} onChange={(e) => setEditStock(e.target.value)}
                            className="w-20 rounded-lg border border-primary px-2 py-1.5 text-sm font-semibold text-center outline-none focus:ring-1 focus:ring-primary"
                            autoFocus />
                        ) : (
                          <span className={cn("text-sm font-bold", isOut ? "text-red-600" : isLow ? "text-orange-600" : "text-gray-900")}>
                            {p.stock}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {isEditing ? (
                          <input type="number" value={editAlert} onChange={(e) => setEditAlert(e.target.value)}
                            className="w-16 rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-center outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                        ) : (
                          <span className="text-xs text-gray-400">≤ {p.lowStockAlert}</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {isOut ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600">
                            <FiXCircle className="h-3 w-3" /> Esgotado
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-orange-600">
                            <FiAlertTriangle className="h-3 w-3" /> Baixo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-600">
                            <FiCheck className="h-3 w-3" /> OK
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => saveEdit(p.id)} disabled={updateMut.isPending}
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500 text-white hover:bg-green-600 disabled:opacity-50">
                              <FiSave className="h-4 w-4" />
                            </button>
                            <button onClick={cancelEdit}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
                              <FiX className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => startEdit(p)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 ml-auto">
                            <FiEdit3 className="h-4 w-4" />
                          </button>
                        )}
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
            Mostrando <strong>{(page - 1) * PAGE_SIZE + 1}</strong>–<strong>{Math.min(page * PAGE_SIZE, total)}</strong> de <strong>{total}</strong>
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
