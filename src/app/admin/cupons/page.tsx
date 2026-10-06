"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  useAdminCoupons, useCreateCoupon, useUpdateCoupon, useDeleteCoupon,
  type AdminCoupon,
} from "@/hooks/use-admin-coupons";
import { useAdminCategories } from "@/hooks/use-admin-products";
import {
  FiPlus, FiSearch, FiEdit2, FiTrash2, FiX, FiCheck, FiRefreshCw,
  FiChevronLeft, FiChevronRight, FiPercent, FiDollarSign, FiTruck,
  FiTag, FiSave, FiLoader, FiCopy, FiAlertTriangle, FiCalendar,
  FiPackage, FiLayers, FiUsers, FiShoppingCart,
} from "react-icons/fi";

function formatBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function toBRLMask(val: string): string {
  const num = val.replace(/\D/g, "");
  if (!num) return "";
  const cents = parseInt(num, 10);
  return (cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fromBRLMask(masked: string): string {
  const clean = masked.replace(/\./g, "").replace(",", ".");
  const num = parseFloat(clean);
  return isNaN(num) ? "" : String(num);
}

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR");
}

function isExpired(endDate: string | null) {
  if (!endDate) return false;
  return new Date(endDate) < new Date();
}

function isScheduled(startDate: string | null) {
  if (!startDate) return false;
  return new Date(startDate) > new Date();
}

const typeLabels: Record<string, { label: string; icon: any; color: string }> = {
  PERCENTAGE: { label: "Percentual", icon: FiPercent, color: "text-blue-600 bg-blue-50" },
  FIXED: { label: "Valor Fixo", icon: FiDollarSign, color: "text-green-600 bg-green-50" },
  FREE_SHIPPING: { label: "Frete Grátis", icon: FiTruck, color: "text-purple-600 bg-purple-50" },
};

const appliesToLabels: Record<string, string> = {
  ORDER: "Pedido inteiro",
  PRODUCT: "Produtos específicos",
  SHIPPING: "Frete",
  CATEGORY: "Categorias",
};

export default function AdminCouponsPage() {
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);

  const PAGE_SIZE = 10;
  const { data, isLoading, refetch } = useAdminCoupons({
    search: searchDebounced, status: statusFilter, type: typeFilter,
    sort: sortBy, order: sortOrder, page, limit: PAGE_SIZE,
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCoupon | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const createMut = useCreateCoupon();
  const updateMut = useUpdateCoupon();
  const deleteMut = useDeleteCoupon();

  const handleSearch = (val: string) => {
    setSearch(val);
    clearTimeout((window as any).__couponSearchTimer);
    (window as any).__couponSearchTimer = setTimeout(() => {
      setSearchDebounced(val);
      setPage(1);
    }, 400);
  };

  const openNew = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (c: AdminCoupon) => { setEditing(c); setModalOpen(true); };

  const handleDelete = async (id: string) => {
    try { await deleteMut.mutateAsync(id); setDeleteConfirm(null); } catch {}
  };

  const toggleSort = (col: string) => {
    if (sortBy === col) setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    else { setSortBy(col); setSortOrder("asc"); }
    setPage(1);
  };

  const coupons = data?.coupons || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cupons</h1>
          <p className="mt-0.5 text-sm text-gray-500">{total} cupons cadastrados</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90">
          <FiPlus className="h-4 w-4" /> Novo Cupom
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 lg:flex-row lg:items-center">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2">
          <FiSearch className="h-4 w-4 text-gray-400" />
          <input value={search} onChange={(e) => handleSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
            placeholder="Buscar por código ou nome..." />
          {search && (
            <button onClick={() => { setSearch(""); setSearchDebounced(""); }} className="text-gray-400 hover:text-gray-600">
              <FiX className="h-4 w-4" />
            </button>
          )}
        </div>

        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none">
          <option value="">Todos os Status</option>
          <option value="active">Ativos</option>
          <option value="inactive">Inativos</option>
          <option value="expired">Expirados</option>
          <option value="scheduled">Agendados</option>
        </select>

        <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none">
          <option value="">Todos os Tipos</option>
          <option value="PERCENTAGE">Percentual</option>
          <option value="FIXED">Valor Fixo</option>
          <option value="FREE_SHIPPING">Frete Grátis</option>
        </select>

        <button onClick={() => refetch()} className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:text-gray-700">
          <FiRefreshCw className="h-4 w-4" />
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {/* Empty */}
      {!isLoading && coupons.length === 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white p-16 text-center">
          <FiTag className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-3 text-lg font-semibold text-gray-600">Nenhum cupom encontrado</p>
          <p className="mt-1 text-sm text-gray-400">
            {searchDebounced || statusFilter || typeFilter ? "Tente alterar os filtros" : "Crie seu primeiro cupom de desconto"}
          </p>
          {!searchDebounced && !statusFilter && !typeFilter && (
            <button onClick={openNew}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90">
              <FiPlus className="h-4 w-4" /> Criar Cupom
            </button>
          )}
        </div>
      )}

      {/* Table */}
      {!isLoading && coupons.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  <th className="px-5 py-3">Cupom</th>
                  <th className="px-5 py-3">Tipo</th>
                  <th className="px-5 py-3 cursor-pointer hover:text-gray-600" onClick={() => toggleSort("value")}>
                    Valor {sortBy === "value" && (sortOrder === "asc" ? "↑" : "↓")}
                  </th>
                  <th className="px-5 py-3">Uso</th>
                  <th className="px-5 py-3">Validade</th>
                  <th className="px-5 py-3">Mín. Pedido</th>
                  <th className="px-5 py-3">Aplica-se a</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => {
                  const typeInfo = typeLabels[c.type] || typeLabels.PERCENTAGE;
                  const expired = isExpired(c.endDate);
                  const scheduled = isScheduled(c.startDate);
                  const TypeIcon = typeInfo.icon;

                  return (
                    <tr key={c.id} className="border-b border-gray-50 transition-colors last:border-0 hover:bg-gray-50/50">
                      <td className="px-5 py-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <code className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-800">{c.code}</code>
                            <button onClick={() => navigator.clipboard.writeText(c.code)} title="Copiar"
                              className="text-gray-300 hover:text-gray-500">
                              <FiCopy className="h-3 w-3" />
                            </button>
                          </div>
                          <p className="mt-0.5 text-xs text-gray-400">{c.name}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold", typeInfo.color)}>
                          <TypeIcon className="h-3 w-3" /> {typeInfo.label}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-sm font-semibold text-gray-900">
                          {c.type === "PERCENTAGE" ? `${c.value}%` : c.type === "FREE_SHIPPING" ? "Grátis" : formatBRL(c.value)}
                        </span>
                        {c.maxDiscount && c.type === "PERCENTAGE" && (
                          <p className="text-[10px] text-gray-400">máx. {formatBRL(c.maxDiscount)}</p>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs text-gray-600">
                          {c.usageCount}{c.usageLimit ? `/${c.usageLimit}` : ""} usos
                        </span>
                        <p className="text-[10px] text-gray-400">{c._count.orders} pedidos</p>
                      </td>
                      <td className="px-5 py-3">
                        <div className="text-xs text-gray-500">
                          {c.startDate || c.endDate ? (
                            <>
                              <p>{formatDate(c.startDate)} → {formatDate(c.endDate)}</p>
                              {expired && <p className="text-red-500 font-semibold">Expirado</p>}
                              {scheduled && <p className="text-blue-500 font-semibold">Agendado</p>}
                            </>
                          ) : (
                            <span className="text-gray-400">Sem prazo</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs text-gray-500">{c.minOrderValue ? formatBRL(c.minOrderValue) : "—"}</span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-[11px] text-gray-500">{appliesToLabels[c.appliesTo]}</span>
                      </td>
                      <td className="px-5 py-3">
                        {c.active && !expired ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-600">
                            <FiCheck className="h-3 w-3" /> Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-500">
                            <FiX className="h-3 w-3" /> {expired ? "Expirado" : "Inativo"}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(c)} title="Editar"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600">
                            <FiEdit2 className="h-4 w-4" />
                          </button>
                          {deleteConfirm === c.id ? (
                            <div className="flex items-center gap-1">
                              <button onClick={() => handleDelete(c.id)} disabled={deleteMut.isPending}
                                className="flex h-8 items-center rounded-lg bg-red-500 px-2 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50">
                                {deleteMut.isPending ? "..." : "Sim"}
                              </button>
                              <button onClick={() => setDeleteConfirm(null)}
                                className="flex h-8 items-center rounded-lg px-2 text-xs text-gray-500 hover:bg-gray-100">
                                Não
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => setDeleteConfirm(c.id)} title="Excluir"
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500">
                              <FiTrash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
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

      {/* Modal */}
      {modalOpen && <CouponModal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} coupon={editing} />}
    </div>
  );
}

// ═══════════════════════════════════════════
// COUPON MODAL
// ═══════════════════════════════════════════

interface CouponModalProps {
  open: boolean;
  onClose: () => void;
  coupon: AdminCoupon | null;
}

function CouponModal({ open, onClose, coupon }: CouponModalProps) {
  const isEdit = !!coupon;
  const createMut = useCreateCoupon();
  const updateMut = useUpdateCoupon();
  const deleteMut = useDeleteCoupon();
  const { data: categoriesData } = useAdminCategories();
  const categories = categoriesData?.categories || [];

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [form, setForm] = useState({
    code: "", name: "", description: "",
    type: "PERCENTAGE" as string,
    appliesTo: "ORDER" as string,
    value: "",
    minOrderValue: "", maxDiscount: "",
    usageLimit: "", usageLimitPerUser: "",
    startDate: "", endDate: "",
    active: true,
  });
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  useState(() => {
    if (coupon) {
      setForm({
        code: coupon.code, name: coupon.name,
        description: coupon.description || "",
        type: coupon.type,
        appliesTo: coupon.appliesTo,
        value: String(coupon.value),
        minOrderValue: coupon.minOrderValue ? String(coupon.minOrderValue) : "",
        maxDiscount: coupon.maxDiscount ? String(coupon.maxDiscount) : "",
        usageLimit: coupon.usageLimit ? String(coupon.usageLimit) : "",
        usageLimitPerUser: coupon.usageLimitPerUser ? String(coupon.usageLimitPerUser) : "",
        startDate: coupon.startDate ? new Date(coupon.startDate).toISOString().slice(0, 16) : "",
        endDate: coupon.endDate ? new Date(coupon.endDate).toISOString().slice(0, 16) : "",
        active: coupon.active,
      });
      setSelectedProducts(coupon.products.map((p) => p.product.id));
      setSelectedCategories(coupon.categories.map((c) => c.category.id));
    }
  });

  const set = (key: string, val: any) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async () => {
    if (!form.code || !form.name || !form.value) return;
    const payload = {
      ...form,
      productIds: form.appliesTo === "PRODUCT" ? selectedProducts : [],
      categoryIds: form.appliesTo === "CATEGORY" ? selectedCategories : [],
    };
    try {
      if (isEdit) await updateMut.mutateAsync({ id: coupon!.id, ...payload });
      else await createMut.mutateAsync(payload);
      onClose();
    } catch {}
  };

  const handleDelete = async () => {
    if (!coupon) return;
    try { await deleteMut.mutateAsync(coupon.id); onClose(); } catch {}
  };

  const isSaving = createMut.isPending || updateMut.isPending;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-8 pb-8">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{isEdit ? "Editar Cupom" : "Novo Cupom"}</h2>
            {isEdit && <p className="text-xs text-gray-400">Código: {coupon!.code}</p>}
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <div className="max-h-[60vh] overflow-y-auto p-6 space-y-5">
          {/* Code + Name */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">Código *</label>
              <input value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase())}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-mono uppercase outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="PROMO10" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">Título *</label>
              <input value={form.name} onChange={(e) => set("name", e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="Promoção de Verão" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-600">Descrição</label>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              placeholder="Descrição interna do cupom..." />
          </div>

          {/* Type + Value */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">Tipo de Desconto *</label>
              <select value={form.type} onChange={(e) => set("type", e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary">
                <option value="PERCENTAGE">Percentual (%)</option>
                <option value="FIXED">Valor Fixo (R$)</option>
                <option value="FREE_SHIPPING">Frete Grátis</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">
                Valor * {form.type === "PERCENTAGE" ? "(%)" : form.type === "FIXED" ? "(R$)" : ""}
              </label>
              {form.type === "FIXED" ? (
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">R$</span>
                  <input value={form.value ? toBRLMask(String(Math.round(parseFloat(form.value) * 100))) : ""}
                    onChange={(e) => set("value", fromBRLMask(e.target.value))}
                    className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="0,00" />
                </div>
              ) : (
                <input type="number" step="0.01" value={form.value} onChange={(e) => set("value", e.target.value)}
                  disabled={form.type === "FREE_SHIPPING"}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
                  placeholder={form.type === "PERCENTAGE" ? "10" : "0"} />
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">Desconto Máximo (R$)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">R$</span>
                <input value={form.maxDiscount ? toBRLMask(String(Math.round(parseFloat(form.maxDiscount) * 100))) : ""}
                  onChange={(e) => set("maxDiscount", fromBRLMask(e.target.value))}
                  className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="0,00" />
              </div>
            </div>
          </div>

          {/* Applies To */}
          <div>
            <label className="mb-2 block text-xs font-semibold text-gray-600">Aplicável a</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { val: "ORDER", label: "Pedido", icon: FiShoppingCart },
                { val: "PRODUCT", label: "Produtos", icon: FiPackage },
                { val: "CATEGORY", label: "Categorias", icon: FiLayers },
                { val: "SHIPPING", label: "Frete", icon: FiTruck },
              ].map((opt) => (
                <button key={opt.val} type="button" onClick={() => set("appliesTo", opt.val)}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-medium transition-all",
                    form.appliesTo === opt.val
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  )}>
                  <opt.icon className="h-3.5 w-3.5" /> {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category selection when appliesTo CATEGORY */}
          {form.appliesTo === "CATEGORY" && categories.length > 0 && (
            <div>
              <label className="mb-2 block text-xs font-semibold text-gray-600">Selecionar Categorias</label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button key={cat.id} type="button"
                    onClick={() => setSelectedCategories((prev) => prev.includes(cat.id) ? prev.filter((x) => x !== cat.id) : [...prev, cat.id])}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
                      selectedCategories.includes(cat.id) ? "border-primary bg-primary/10 text-primary" : "border-gray-200 text-gray-500 hover:border-gray-300"
                    )}>
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Min Order + Usage */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">Valor Mínimo do Pedido</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">R$</span>
                <input value={form.minOrderValue ? toBRLMask(String(Math.round(parseFloat(form.minOrderValue) * 100))) : ""}
                  onChange={(e) => set("minOrderValue", fromBRLMask(e.target.value))}
                  className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="0,00" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">Limite de Uso Total</label>
              <input type="number" value={form.usageLimit} onChange={(e) => set("usageLimit", e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="Ilimitado" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">Limite por Usuário</label>
              <input type="number" value={form.usageLimitPerUser} onChange={(e) => set("usageLimitPerUser", e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="Ilimitado" />
            </div>
          </div>

          {/* Dates */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">Data Início</label>
              <input type="datetime-local" value={form.startDate} onChange={(e) => set("startDate", e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600">Data Fim</label>
              <input type="datetime-local" value={form.endDate} onChange={(e) => set("endDate", e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
            </div>
          </div>

          {/* Active */}
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 p-4 hover:border-primary/30">
            <input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary" />
            <div>
              <p className="text-sm font-semibold text-gray-900">Cupom Ativo</p>
              <p className="text-xs text-gray-500">Disponível para uso pelos clientes</p>
            </div>
          </label>

          {/* Usage stats (edit only) */}
          {isEdit && (
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs font-semibold text-gray-500 mb-2">Estatísticas</p>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-lg font-bold text-gray-900">{coupon!.usageCount}</p>
                  <p className="text-[10px] text-gray-500">Usos</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">{coupon!._count.orders}</p>
                  <p className="text-[10px] text-gray-500">Pedidos</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">{formatDate(coupon!.createdAt)}</p>
                  <p className="text-[10px] text-gray-500">Criado em</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
          <div>
            {isEdit && (
              confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-500">Confirmar exclusão?</span>
                  <button onClick={handleDelete} disabled={deleteMut.isPending}
                    className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50">
                    {deleteMut.isPending ? "Excluindo..." : "Sim, excluir"}
                  </button>
                  <button onClick={() => setConfirmDelete(false)} className="text-xs text-gray-500">Cancelar</button>
                </div>
              ) : (
                <button onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50">
                  <FiTrash2 className="h-3.5 w-3.5" /> Excluir Cupom
                </button>
              )
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100">Cancelar</button>
            <button onClick={handleSubmit} disabled={isSaving || !form.code || !form.name || (!form.value && form.type !== "FREE_SHIPPING")}
              className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50">
              {isSaving ? <FiLoader className="h-4 w-4 animate-spin" /> : <FiSave className="h-4 w-4" />}
              {isEdit ? "Salvar" : "Criar Cupom"}
            </button>
          </div>
        </div>

        {(createMut.error || updateMut.error || deleteMut.error) && (
          <div className="border-t border-red-100 bg-red-50 px-6 py-3">
            <p className="text-xs text-red-600">{(createMut.error || updateMut.error || deleteMut.error)?.message}</p>
          </div>
        )}
      </div>
    </div>
  );
}
