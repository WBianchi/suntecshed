"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAdminProducts, useDeleteProduct, useBulkDeleteProducts, useAdminCategories, type AdminProduct } from "@/hooks/use-admin-products";
import { StatusBadge } from "@/components/admin/ui/StatusBadge";
import { ProductModal } from "@/components/admin/modals/ProductModal";
import { CategoryModal } from "@/components/admin/modals/CategoryModal";
import { BrandModal } from "@/components/admin/modals/BrandModal";
import {
  FiPlus, FiSearch, FiFilter, FiGrid, FiList, FiEdit2, FiTrash2,
  FiEye, FiChevronLeft, FiChevronRight, FiMoreVertical, FiRefreshCw,
  FiDownload, FiTag, FiPackage, FiAlertTriangle, FiCheck, FiX,
  FiLayers, FiImage,
} from "react-icons/fi";

function formatBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Hoje";
  if (days === 1) return "Ontem";
  if (days < 30) return `${days}d atrás`;
  return new Date(dateStr).toLocaleDateString("pt-BR");
}

export default function AdminProductsPage() {
  // ── Filters ──
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // ── Data ──
  const PAGE_SIZE = 10;
  const { data, isLoading, refetch } = useAdminProducts({
    search: searchDebounced, category: categoryFilter, status: statusFilter,
    sort: sortBy, order: sortOrder, page, limit: PAGE_SIZE,
  });
  const { data: categoriesData } = useAdminCategories();
  const deleteMut = useDeleteProduct();

  // ── Selection ──
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const bulkDeleteMut = useBulkDeleteProducts();

  // ── Modals ──
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [categoryEditOpen, setCategoryEditOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [brandModalOpen, setBrandModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // ── Search debounce ──
  const handleSearch = (val: string) => {
    setSearch(val);
    clearTimeout((window as any).__productSearchTimer);
    (window as any).__productSearchTimer = setTimeout(() => {
      setSearchDebounced(val);
      setPage(1);
    }, 400);
  };

  const openNewProduct = () => { setEditingProduct(null); setProductModalOpen(true); };
  const openEditProduct = (p: AdminProduct) => { setEditingProduct(p); setProductModalOpen(true); };

  const handleDeleteProduct = async (id: string) => {
    try {
      await deleteMut.mutateAsync(id);
      setDeleteConfirm(null);
    } catch {}
  };

  const toggleSort = (col: string) => {
    if (sortBy === col) setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    else { setSortBy(col); setSortOrder("asc"); }
    setPage(1);
  };

  const products = data?.products || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;
  const categories = categoriesData?.categories || [];

  const allPageSelected = products.length > 0 && products.every((p) => selectedIds.has(p.id));
  const someSelected = selectedIds.size > 0;

  const toggleSelectAll = () => {
    if (allPageSelected) {
      setSelectedIds((prev) => { const next = new Set(prev); products.forEach((p) => next.delete(p.id)); return next; });
    } else {
      setSelectedIds((prev) => { const next = new Set(prev); products.forEach((p) => next.add(p.id)); return next; });
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  const handleBulkDelete = async () => {
    try {
      await bulkDeleteMut.mutateAsync(Array.from(selectedIds));
      setSelectedIds(new Set());
      setBulkDeleteConfirm(false);
    } catch {}
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
          <p className="mt-0.5 text-sm text-gray-500">{total} produtos cadastrados</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setCategoryManagerOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <FiLayers className="h-4 w-4" /> Categorias
          </button>
          <button onClick={() => setBrandModalOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <FiTag className="h-4 w-4" /> Marcas
          </button>
          <button onClick={openNewProduct}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90">
            <FiPlus className="h-4 w-4" /> Novo Produto
          </button>
        </div>
      </div>

      {/* ── Filters Bar ── */}
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 lg:flex-row lg:items-center">
        {/* Search */}
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2">
          <FiSearch className="h-4 w-4 text-gray-400" />
          <input value={search} onChange={(e) => handleSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
            placeholder="Buscar por nome, SKU ou código de barras..." />
          {search && (
            <button onClick={() => { setSearch(""); setSearchDebounced(""); }} className="text-gray-400 hover:text-gray-600">
              <FiX className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Category Filter */}
        <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none">
          <option value="">Todas as Categorias</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name} ({c._count.products})</option>
          ))}
        </select>

        {/* Status Filter */}
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none">
          <option value="">Todos os Status</option>
          <option value="active">Ativos</option>
          <option value="inactive">Inativos</option>
          <option value="lowStock">Estoque Baixo</option>
          <option value="outOfStock">Sem Estoque</option>
        </select>

        {/* View Mode */}
        <div className="flex items-center gap-1 rounded-xl border border-gray-200 p-1">
          <button onClick={() => setViewMode("table")}
            className={cn("rounded-lg p-2 transition-all", viewMode === "table" ? "bg-primary text-white" : "text-gray-500 hover:text-gray-700")}>
            <FiList className="h-4 w-4" />
          </button>
          <button onClick={() => setViewMode("grid")}
            className={cn("rounded-lg p-2 transition-all", viewMode === "grid" ? "bg-primary text-white" : "text-gray-500 hover:text-gray-700")}>
            <FiGrid className="h-4 w-4" />
          </button>
        </div>

        <button onClick={() => refetch()} className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:text-gray-700">
          <FiRefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* ── Bulk Action Bar ── */}
      {someSelected && (
        <div className="flex items-center justify-between rounded-2xl border border-red-100 bg-red-50 px-5 py-3">
          <span className="text-sm font-medium text-red-700">
            {selectedIds.size} produto{selectedIds.size > 1 ? "s" : ""} selecionado{selectedIds.size > 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-2">
            <button onClick={() => setSelectedIds(new Set())}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100">
              Cancelar seleção
            </button>
            {bulkDeleteConfirm ? (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-red-700 font-medium">Confirmar exclusão de {selectedIds.size} produto{selectedIds.size > 1 ? "s" : ""}?</span>
                <button onClick={handleBulkDelete} disabled={bulkDeleteMut.isPending}
                  className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50">
                  {bulkDeleteMut.isPending ? "Excluindo..." : "Sim, excluir"}
                </button>
                <button onClick={() => setBulkDeleteConfirm(false)}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100">
                  Não
                </button>
              </div>
            ) : (
              <button onClick={() => setBulkDeleteConfirm(true)}
                className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700">
                <FiTrash2 className="h-3.5 w-3.5" /> Excluir selecionados
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Loading ── */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {/* ── Empty State ── */}
      {!isLoading && products.length === 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white p-16 text-center">
          <FiPackage className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-3 text-lg font-semibold text-gray-600">Nenhum produto encontrado</p>
          <p className="mt-1 text-sm text-gray-400">
            {searchDebounced || categoryFilter || statusFilter ? "Tente alterar os filtros" : "Comece adicionando seu primeiro produto"}
          </p>
          {!searchDebounced && !categoryFilter && !statusFilter && (
            <button onClick={openNewProduct}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90">
              <FiPlus className="h-4 w-4" /> Criar Produto
            </button>
          )}
        </div>
      )}

      {/* ── TABLE VIEW ── */}
      {!isLoading && products.length > 0 && viewMode === "table" && (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  <th className="pl-5 pr-2 py-3 w-10">
                    <input type="checkbox" checked={allPageSelected} onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-gray-300 accent-primary cursor-pointer" />
                  </th>
                  <th className="px-3 py-3 w-16"></th>
                  <th className="px-5 py-3 cursor-pointer hover:text-gray-600" onClick={() => toggleSort("name")}>
                    <span className="flex items-center gap-1">Produto {sortBy === "name" && (sortOrder === "asc" ? "↑" : "↓")}</span>
                  </th>
                  <th className="px-5 py-3">SKU</th>
                  <th className="px-5 py-3 cursor-pointer hover:text-gray-600" onClick={() => toggleSort("price")}>
                    <span className="flex items-center gap-1">Preço {sortBy === "price" && (sortOrder === "asc" ? "↑" : "↓")}</span>
                  </th>
                  <th className="px-5 py-3 cursor-pointer hover:text-gray-600" onClick={() => toggleSort("stock")}>
                    <span className="flex items-center gap-1">Estoque {sortBy === "stock" && (sortOrder === "asc" ? "↑" : "↓")}</span>
                  </th>
                  <th className="px-5 py-3">Categorias</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Data</th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className={cn("border-b border-gray-50 transition-colors last:border-0 hover:bg-gray-50/50", selectedIds.has(p.id) && "bg-red-50/40")}>
                    <td className="pl-5 pr-2 py-3">
                      <input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => toggleSelect(p.id)}
                        className="h-4 w-4 rounded border-gray-300 accent-primary cursor-pointer" />
                    </td>
                    <td className="px-3 py-3">
                      {p.image ? (
                        <img src={p.image} alt={p.name} className="h-10 w-10 rounded-lg object-cover" />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                          <FiImage className="h-4 w-4 text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">{p.name}</p>
                        <p className="truncate text-[11px] text-gray-400">/{p.slug}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs text-gray-500">{p.sku || "—"}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{formatBRL(p.price)}</p>
                        {p.compareAtPrice && (
                          <p className="text-[11px] text-gray-400 line-through">{formatBRL(p.compareAtPrice)}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        {!p.manageStock ? (
                          <span className="text-xs text-gray-400">Sem controle</span>
                        ) : p.stock <= 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600">
                            <FiX className="h-3 w-3" /> Esgotado
                          </span>
                        ) : p.stock <= p.lowStockAlert ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-600">
                            <FiAlertTriangle className="h-3 w-3" /> {p.stock}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-600">{p.stock}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        {p.categoryNames.slice(0, 2).map((c) => (
                          <span key={c} className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600">{c}</span>
                        ))}
                        {p.categoryNames.length > 2 && (
                          <span className="text-[10px] text-gray-400">+{p.categoryNames.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {p.active ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-600">
                          <FiCheck className="h-3 w-3" /> Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-500">
                          <FiX className="h-3 w-3" /> Inativo
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs text-gray-400">{timeAgo(p.createdAt)}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => window.open(`/produto/${p.slug}`, "_blank")} title="Ver na loja"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                          <FiEye className="h-4 w-4" />
                        </button>
                        <button onClick={() => openEditProduct(p)} title="Editar"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600">
                          <FiEdit2 className="h-4 w-4" />
                        </button>
                        {deleteConfirm === p.id ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleDeleteProduct(p.id)} disabled={deleteMut.isPending}
                              className="flex h-8 items-center rounded-lg bg-red-500 px-2 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50">
                              {deleteMut.isPending ? "..." : "Sim"}
                            </button>
                            <button onClick={() => setDeleteConfirm(null)}
                              className="flex h-8 items-center rounded-lg px-2 text-xs text-gray-500 hover:bg-gray-100">
                              Não
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => setDeleteConfirm(p.id)} title="Excluir"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500">
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── GRID VIEW ── */}
      {!isLoading && products.length > 0 && viewMode === "grid" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => (
            <div key={p.id} className={cn("group overflow-hidden rounded-2xl border bg-white transition-all hover:shadow-lg hover:shadow-gray-100/50", selectedIds.has(p.id) ? "border-red-300 bg-red-50/30" : "border-gray-100 hover:border-gray-200")}>
              <div className="relative aspect-square bg-gray-100">
                {p.image ? (
                  <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <FiImage className="h-10 w-10 text-gray-300" />
                  </div>
                )}
                <div className="absolute left-2 top-2">
                  <input type="checkbox" checked={selectedIds.has(p.id)} onChange={() => toggleSelect(p.id)}
                    className="h-4 w-4 rounded border-gray-300 accent-primary cursor-pointer shadow" />
                </div>
                <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button onClick={() => openEditProduct(p)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-gray-700 shadow-sm hover:bg-white">
                    <FiEdit2 className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => window.open(`/produto/${p.slug}`, "_blank")}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-gray-700 shadow-sm hover:bg-white">
                    <FiEye className="h-3.5 w-3.5" />
                  </button>
                </div>
                {!p.active && (
                  <span className="absolute left-2 top-2 rounded-md bg-gray-900/70 px-2 py-0.5 text-[10px] font-bold text-white">Inativo</span>
                )}
                {p.compareAtPrice && p.compareAtPrice > p.price && (
                  <span className="absolute left-2 bottom-2 rounded-md bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                    -{Math.round(((p.compareAtPrice - p.price) / p.compareAtPrice) * 100)}%
                  </span>
                )}
              </div>
              <div className="p-4">
                <div className="flex flex-wrap gap-1 mb-2">
                  {p.categoryNames.slice(0, 2).map((c) => (
                    <span key={c} className="rounded-md bg-primary/5 px-1.5 py-0.5 text-[10px] font-medium text-primary">{c}</span>
                  ))}
                </div>
                <h3 className="line-clamp-2 text-sm font-semibold text-gray-900">{p.name}</h3>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-lg font-bold text-primary">{formatBRL(p.price)}</span>
                  {p.compareAtPrice && (
                    <span className="text-xs text-gray-400 line-through">{formatBRL(p.compareAtPrice)}</span>
                  )}
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                  <span>Estoque: {p.stock}</span>
                  <span>{p.sku || "Sem SKU"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Pagination ── */}
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
              const pageNum = page <= 3 ? i + 1 : page + i - 2;
              if (pageNum < 1 || pageNum > totalPages) return null;
              return (
                <button key={pageNum} onClick={() => setPage(pageNum)}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-all",
                    page === pageNum ? "bg-primary text-white" : "text-gray-500 hover:bg-gray-50"
                  )}>
                  {pageNum}
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

      {/* ── Categories Mini-Manager (within Filters section) ── */}
      {categoryManagerOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-8 pb-8">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setCategoryManagerOpen(false)} />
          <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-lg font-bold text-gray-900">Gerenciar Categorias</h2>
              <div className="flex items-center gap-2">
                <button onClick={() => { setCategoryManagerOpen(false); setEditingCategory(null); setCategoryEditOpen(true); }}
                  className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90">
                  <FiPlus className="h-3.5 w-3.5" /> Nova Categoria
                </button>
                <button onClick={() => setCategoryManagerOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
                  <FiX className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-4">
              {categories.length === 0 ? (
                <div className="p-10 text-center">
                  <FiLayers className="mx-auto h-10 w-10 text-gray-300" />
                  <p className="mt-2 text-sm text-gray-400">Nenhuma categoria</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <div key={cat.id} className="flex items-center justify-between rounded-xl border border-gray-100 p-3 transition-all hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        {cat.image ? (
                          <img src={cat.image} alt={cat.name} className="h-10 w-10 rounded-lg object-cover" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/5 text-lg">
                            {cat.icon || "📁"}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{cat.name}</p>
                          <p className="text-[11px] text-gray-400">
                            /{cat.slug} · {cat._count.products} produtos
                            {cat.parent && <span> · pai: {cat.parent.name}</span>}
                          </p>
                        </div>
                      </div>
                      <button onClick={() => { setCategoryManagerOpen(false); setEditingCategory(cat); setCategoryEditOpen(true); }}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700">
                        <FiEdit2 className="h-3.5 w-3.5" /> Editar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      <ProductModal open={productModalOpen} onClose={() => { setProductModalOpen(false); setEditingProduct(null); }} product={editingProduct} />
      <CategoryModal open={categoryEditOpen} onClose={() => { setCategoryEditOpen(false); setEditingCategory(null); }} category={editingCategory} />
      <BrandModal open={brandModalOpen} onClose={() => setBrandModalOpen(false)} />
    </div>
  );
}
