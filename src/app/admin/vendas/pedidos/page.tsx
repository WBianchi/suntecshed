"use client";

import { useState } from "react";
import { cn, downloadFiles } from "@/lib/utils";
import { useAdminOrders, useUpdateOrder, useBulkOrderAction, useBuyShippingLabel, type AdminOrder } from "@/hooks/use-admin-orders";
import { ExportOrdersModal } from "@/components/admin/ExportOrdersModal";
import {
  FiSearch, FiX, FiRefreshCw, FiChevronLeft, FiChevronRight, FiEye,
  FiPackage, FiTruck, FiCheck, FiClock, FiAlertTriangle,
  FiDollarSign, FiCreditCard, FiUser, FiMapPin, FiHash,
  FiCalendar, FiCopy, FiChevronDown, FiPaperclip, FiDownload, FiLoader,
  FiFileText, FiTrash2, FiRotateCcw, FiAlertOctagon,
} from "react-icons/fi";

function formatBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function formatDateTime(d: string) {
  return new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const orderStatusMap: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: "Pendente", color: "bg-yellow-50 text-yellow-700", icon: FiClock },
  AWAITING_PAYMENT: { label: "Aguardando Pgto", color: "bg-orange-50 text-orange-700", icon: FiCreditCard },
  PAYMENT_CONFIRMED: { label: "Pago", color: "bg-green-50 text-green-700", icon: FiDollarSign },
  PROCESSING: { label: "Processando", color: "bg-indigo-50 text-indigo-700", icon: FiPackage },
  SHIPPED: { label: "Enviado", color: "bg-purple-50 text-purple-700", icon: FiTruck },
  DELIVERED: { label: "Entregue", color: "bg-green-50 text-green-700", icon: FiCheck },
  CANCELLED: { label: "Cancelado", color: "bg-red-50 text-red-700", icon: FiX },
  REFUNDED: { label: "Reembolsado", color: "bg-gray-100 text-gray-600", icon: FiAlertTriangle },
  MISSING_LABEL: { label: "Ausência de Etiqueta", color: "bg-brand-50 text-brand-700", icon: FiPaperclip },
  ORDER_ERROR: { label: "Erro no Pedido", color: "bg-red-100 text-red-800", icon: FiAlertOctagon },
};

// Ações rápidas de status pra mudança em massa — a lista que o Caio pediu.
const bulkStatusOptions = [
  { value: "AWAITING_PAYMENT", label: "Aguardando Pagamento" },
  { value: "PAYMENT_CONFIRMED", label: "Pagamento Aprovado" },
  { value: "SHIPPED", label: "Pedido Enviado" },
  { value: "CANCELLED", label: "Cancelado" },
  { value: "REFUNDED", label: "Reembolsado" },
  { value: "MISSING_LABEL", label: "Ausência de Etiqueta" },
  { value: "ORDER_ERROR", label: "Erro no Pedido" },
];

const paymentStatusMap: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pendente", color: "text-yellow-600" },
  CONFIRMED: { label: "Confirmado", color: "text-green-600" },
  FAILED: { label: "Falhou", color: "text-red-600" },
  REFUNDED: { label: "Reembolsado", color: "text-gray-600" },
  CANCELLED: { label: "Cancelado", color: "text-red-500" },
};

const paymentMethodLabels: Record<string, string> = {
  PIX: "PIX",
  BOLETO: "Boleto",
  CREDIT_CARD: "Cartão de Crédito",
  WALLET: "Carteira",
};

/** Retorna o label de método de pagamento, tratando o caso SALDO + PIX */
function paymentMethodDisplay(order: AdminOrder): string {
  if (order.paymentMethod === "PIX" && order.walletAmountUsed > 0) {
    return "SALDO + PIX";
  }
  return paymentMethodLabels[order.paymentMethod || ""] || "—";
}

const allStatuses = ["PENDING", "AWAITING_PAYMENT", "PAYMENT_CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED", "MISSING_LABEL", "ORDER_ERROR"];
const PAGE_SIZE = 10;

export default function AdminOrdersPage() {
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);

  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [downloadingSelected, setDownloadingSelected] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [bulkStatusValue, setBulkStatusValue] = useState("");
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [deleteAllText, setDeleteAllText] = useState("");
  const [deleteAllLoading, setDeleteAllLoading] = useState(false);
  const [exportingAll, setExportingAll] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [bulkExportModalOpen, setBulkExportModalOpen] = useState(false);

  const { data, isLoading, refetch } = useAdminOrders({
    search: searchDebounced, status: statusFilter, paymentStatus: paymentFilter,
    dateFrom, dateTo, sort: sortBy, order: sortOrder, page, limit: PAGE_SIZE, trash: showTrash,
  });

  const updateMut = useUpdateOrder();
  const bulkMut = useBulkOrderAction();

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllOnPage = (orders: AdminOrder[]) => {
    const allSelected = orders.length > 0 && orders.every((o) => selectedIds.has(o.id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) orders.forEach((o) => next.delete(o.id));
      else orders.forEach((o) => next.add(o.id));
      return next;
    });
  };

  const handleDownloadSelected = async (orders: AdminOrder[]) => {
    const targets = orders.filter((o) => selectedIds.has(o.id) && o.labelUrl);
    if (targets.length === 0) return;
    setDownloadingSelected(true);
    try {
      await downloadFiles(targets.map((o) => ({ url: o.labelUrl as string, name: `etiqueta-${o.orderNumber}` })));
    } finally {
      setDownloadingSelected(false);
    }
  };

  // Baixa só as etiquetas da página atual (não do site inteiro — antes isso
  // baixava até 500 etiquetas de uma vez sem querer).
  const handleDownloadAllLabels = async (orders: AdminOrder[]) => {
    setDownloadingAll(true);
    try {
      const targets = orders.filter((o) => o.labelUrl);
      if (targets.length === 0) return;
      await downloadFiles(targets.map((o) => ({ url: o.labelUrl as string, name: `etiqueta-${o.orderNumber}` })));
    } finally {
      setDownloadingAll(false);
    }
  };

  const handleBulkStatusApply = async () => {
    if (!bulkStatusValue || selectedIds.size === 0) return;
    try {
      await bulkMut.mutateAsync({ ids: Array.from(selectedIds), action: "status", status: bulkStatusValue });
      setSelectedIds(new Set());
      setBulkStatusValue("");
    } catch {}
  };

  const handleBulkTrash = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Mover ${selectedIds.size} pedido(s) pra lixeira?`)) return;
    try {
      await bulkMut.mutateAsync({ ids: Array.from(selectedIds), action: "trash" });
      setSelectedIds(new Set());
    } catch {}
  };

  const handleBulkRestore = async () => {
    if (selectedIds.size === 0) return;
    try {
      await bulkMut.mutateAsync({ ids: Array.from(selectedIds), action: "restore" });
      setSelectedIds(new Set());
    } catch {}
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Excluir definitivamente ${selectedIds.size} pedido(s)? Essa ação não pode ser desfeita.`)) return;
    try {
      await bulkMut.mutateAsync({ ids: Array.from(selectedIds), action: "delete" });
      setSelectedIds(new Set());
    } catch {}
  };

  const handleExportCsv = (orders: AdminOrder[]) => {
    if (orders.length === 0) return;
    const rows = orders.map((o) => ({
      Pedido: o.orderNumber,
      Data: formatDateTime(o.createdAt),
      Cliente: o.user?.name || "",
      "E-mail": o.user?.email || "",
      Itens: o.items.map((i) => `${i.quantity}x ${i.name}`).join(" | "),
      Total: o.total.toFixed(2).replace(".", ","),
      Status: orderStatusMap[o.status]?.label || o.status,
      Rastreio: o.trackingCode || "",
      Endereco: o.address
        ? `${o.address.street}, ${o.address.number} - ${o.address.neighborhood}, ${o.address.city}/${o.address.state}, ${o.address.zipCode}`
        : "",
    }));
    const headers = Object.keys(rows[0]);
    const csvLines = [
      headers.join(";"),
      ...rows.map((r) => headers.map((h) => `"${String((r as Record<string, string>)[h]).replace(/"/g, '""')}"`).join(";")),
    ];
    const csv = "\uFEFF" + csvLines.join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pedidos-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Exporta TODOS os pedidos que batem com os filtros atuais (não só os da
  // página visível) — busca tudo numa chamada só, respeitando busca/status/
  // pagamento/data já aplicados.
  const handleExportAll = async () => {
    setExportingAll(true);
    try {
      const params = new URLSearchParams();
      if (searchDebounced) params.set("search", searchDebounced);
      if (statusFilter) params.set("status", statusFilter);
      if (paymentFilter) params.set("paymentStatus", paymentFilter);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      if (showTrash) params.set("trash", "true");
      params.set("sort", sortBy);
      params.set("order", sortOrder);
      params.set("limit", String(Math.min(Math.max(total, 1), 20000)));
      params.set("page", "1");
      const res = await fetch(`/api/admin/orders?${params}`);
      const json = await res.json();
      handleExportCsv(json.orders || []);
    } finally {
      setExportingAll(false);
    }
  };

  const handleRowTrash = (id: string) => {
    if (!confirm("Mover este pedido pra lixeira?")) return;
    bulkMut.mutate({ ids: [id], action: "trash" });
  };

  const handleRowRestore = (id: string) => {
    bulkMut.mutate({ ids: [id], action: "restore" });
  };

  const handleRowDelete = (id: string) => {
    if (!confirm("Excluir definitivamente este pedido? Essa ação não pode ser desfeita.")) return;
    bulkMut.mutate({ ids: [id], action: "delete" });
  };

  const handleDeleteAllConfirm = async () => {
    setDeleteAllLoading(true);
    try {
      const res = await fetch("/api/admin/orders/delete-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: deleteAllText }),
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || "Erro ao excluir pedidos");
        return;
      }
      setDeleteAllOpen(false);
      setDeleteAllText("");
      refetch();
    } finally {
      setDeleteAllLoading(false);
    }
  };

  const handleSearch = (val: string) => {
    setSearch(val);
    clearTimeout((window as any).__orderSearchTimer);
    (window as any).__orderSearchTimer = setTimeout(() => {
      setSearchDebounced(val);
      setPage(1);
    }, 400);
  };

  const toggleSort = (col: string) => {
    if (sortBy === col) setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    else { setSortBy(col); setSortOrder("desc"); }
    setPage(1);
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try { await updateMut.mutateAsync({ id: orderId, status: newStatus }); } catch {}
  };

  const orders = data?.orders || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
          <p className="mt-0.5 text-sm text-gray-500">{total} pedidos{showTrash ? " na lixeira" : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExportModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary/90"
          >
            <FiDownload className="h-3.5 w-3.5" />
            Exportar Pedidos
          </button>
          <button
            onClick={handleExportAll}
            disabled={exportingAll}
            className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:border-primary hover:text-primary disabled:opacity-50"
          >
            {exportingAll ? <FiLoader className="h-3.5 w-3.5 animate-spin" /> : <FiFileText className="h-3.5 w-3.5" />}
            Exportar todos ({total})
          </button>
          <button
            onClick={() => { setShowTrash((v) => !v); setSelectedIds(new Set()); setPage(1); }}
            className={cn(
              "flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all",
              showTrash ? "border-primary bg-primary/5 text-primary" : "border-gray-200 text-gray-600 hover:border-gray-300"
            )}
          >
            <FiTrash2 className="h-3.5 w-3.5" />
            {showTrash ? "Ver pedidos ativos" : "Lixeira"}
          </button>
          <button
            onClick={() => setDeleteAllOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-red-100 px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-50"
          >
            <FiAlertOctagon className="h-3.5 w-3.5" />
            Excluir todos os pedidos
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 xl:flex-row xl:items-center">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-gray-200 bg-gray-50/50 px-3 py-2">
          <FiSearch className="h-4 w-4 text-gray-400" />
          <input value={search} onChange={(e) => handleSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
            placeholder="Buscar por nº do pedido, nome ou email..." />
          {search && <button onClick={() => { setSearch(""); setSearchDebounced(""); }} className="text-gray-400 hover:text-gray-600"><FiX className="h-4 w-4" /></button>}
        </div>

        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none">
          <option value="">Todos os Status</option>
          {allStatuses.map((s) => <option key={s} value={s}>{orderStatusMap[s]?.label || s}</option>)}
        </select>

        <select value={paymentFilter} onChange={(e) => { setPaymentFilter(e.target.value); setPage(1); }}
          className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none">
          <option value="">Pagamento</option>
          <option value="PENDING">Pgto Pendente</option>
          <option value="CONFIRMED">Pgto Confirmado</option>
          <option value="FAILED">Pgto Falhou</option>
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

      {/* Ações em massa — status, exportar, lixeira/excluir */}
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <div className="text-sm font-medium text-gray-700">
            {selectedIds.size} pedido(s) selecionado(s)
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {!showTrash && (
              <>
                <select
                  value={bulkStatusValue}
                  onChange={(e) => setBulkStatusValue(e.target.value)}
                  className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 outline-none"
                >
                  <option value="">Mudar status para...</option>
                  {bulkStatusOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <button
                  onClick={handleBulkStatusApply}
                  disabled={!bulkStatusValue || bulkMut.isPending}
                  className="flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-40"
                >
                  {bulkMut.isPending ? <FiLoader className="h-3.5 w-3.5 animate-spin" /> : <FiCheck className="h-3.5 w-3.5" />}
                  Aplicar
                </button>
              </>
            )}
            <button
              onClick={() => setBulkExportModalOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:border-primary hover:text-primary"
            >
              <FiFileText className="h-3.5 w-3.5" />
              Exportar Excel
            </button>
            {showTrash ? (
              <button
                onClick={handleBulkRestore}
                disabled={bulkMut.isPending}
                className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:border-primary hover:text-primary disabled:opacity-40"
              >
                <FiRotateCcw className="h-3.5 w-3.5" />
                Restaurar
              </button>
            ) : (
              <button
                onClick={handleBulkTrash}
                disabled={bulkMut.isPending}
                className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:border-primary hover:text-primary disabled:opacity-40"
              >
                <FiTrash2 className="h-3.5 w-3.5" />
                Mover pra lixeira
              </button>
            )}
            <button
              onClick={handleBulkDelete}
              disabled={bulkMut.isPending}
              className="flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 disabled:opacity-40"
            >
              <FiX className="h-3.5 w-3.5" />
              Excluir
            </button>
          </div>
        </div>
      )}

      {/* Etiquetas — download em massa */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <FiPaperclip className="h-4 w-4 text-primary" />
          {selectedIds.size > 0 ? `${selectedIds.size} pedido(s) selecionado(s)` : "Selecione pedidos na tabela pra baixar as etiquetas em lote"}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleDownloadSelected(data?.orders || [])}
            disabled={selectedIds.size === 0 || downloadingSelected}
            className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:border-primary hover:text-primary disabled:opacity-40"
          >
            {downloadingSelected ? <FiLoader className="h-3.5 w-3.5 animate-spin" /> : <FiDownload className="h-3.5 w-3.5" />}
            Baixar selecionadas
          </button>
          <button
            onClick={() => handleDownloadAllLabels(data?.orders || [])}
            disabled={downloadingAll}
            className="flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
          >
            {downloadingAll ? <FiLoader className="h-3.5 w-3.5 animate-spin" /> : <FiDownload className="h-3.5 w-3.5" />}
            Baixar etiquetas desta página
          </button>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {/* Empty */}
      {!isLoading && orders.length === 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white p-16 text-center">
          <FiPackage className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-3 text-lg font-semibold text-gray-600">Nenhum pedido encontrado</p>
          <p className="mt-1 text-sm text-gray-400">
            {searchDebounced || statusFilter || paymentFilter || dateFrom ? "Tente alterar os filtros" : "Os pedidos aparecerão aqui"}
          </p>
        </div>
      )}

      {/* Table */}
      {!isLoading && orders.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  <th className="w-10 px-5 py-3">
                    <input
                      type="checkbox"
                      checked={orders.length > 0 && orders.every((o) => selectedIds.has(o.id))}
                      onChange={() => toggleSelectAllOnPage(orders)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/30"
                    />
                  </th>
                  <th className="px-5 py-3">Pedido</th>
                  <th className="px-5 py-3">Cliente</th>
                  <th className="px-5 py-3">Itens</th>
                  <th className="px-5 py-3 cursor-pointer hover:text-gray-600" onClick={() => toggleSort("total")}>
                    Total {sortBy === "total" && (sortOrder === "asc" ? "↑" : "↓")}
                  </th>
                  <th className="px-5 py-3">Pagamento</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 cursor-pointer hover:text-gray-600" onClick={() => toggleSort("createdAt")}>
                    Data {sortBy === "createdAt" && (sortOrder === "asc" ? "↑" : "↓")}
                  </th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const st = orderStatusMap[o.status] || orderStatusMap.PENDING;
                  const ps = paymentStatusMap[o.paymentStatus] || paymentStatusMap.PENDING;
                  const StIcon = st.icon;
                  return (
                    <tr key={o.id} className="border-b border-gray-50 transition-colors last:border-0 hover:bg-gray-50/50">
                      <td className="px-5 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(o.id)}
                          onChange={() => toggleSelect(o.id)}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/30"
                        />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <code className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-bold text-gray-700">#{o.orderNumber}</code>
                          <button onClick={() => navigator.clipboard.writeText(o.orderNumber)} className="text-gray-300 hover:text-gray-500">
                            <FiCopy className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-sm font-medium text-gray-900 truncate max-w-[150px]">{o.user.name}</p>
                        <p className="text-[11px] text-gray-400 truncate max-w-[150px]">{o.user.email}</p>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs text-gray-600">{o.items.length} {o.items.length === 1 ? "item" : "itens"}</span>
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-sm font-semibold text-gray-900">{formatBRL(o.total)}</p>
                        {o.discount > 0 && <p className="text-[10px] text-green-600">-{formatBRL(o.discount)}</p>}
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-xs text-gray-600">{paymentMethodDisplay(o)}</p>
                        {o.paymentMethod !== "PIX" && (
                          <p className={cn("text-[11px] font-semibold", ps.color)}>{ps.label}</p>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <div className="relative">
                          <select
                            value={o.status}
                            onChange={(e) => handleStatusChange(o.id, e.target.value)}
                            disabled={updateMut.isPending}
                            className={cn("appearance-none rounded-full border-0 px-2.5 py-1 pr-6 text-[11px] font-semibold outline-none cursor-pointer", st.color)}
                          >
                            {allStatuses.map((s) => (
                              <option key={s} value={s}>{orderStatusMap[s]?.label || s}</option>
                            ))}
                          </select>
                          <FiChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 opacity-50" />
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs text-gray-400">{formatDateTime(o.createdAt)}</span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => { setSelectedOrder(o); setDetailOpen(true); }}
                            disabled={!o.labelUrl}
                            title={o.labelUrl ? "Ver etiqueta anexada" : "Sem etiqueta anexada"}
                            className={cn(
                              "flex h-8 w-8 items-center justify-center rounded-lg",
                              o.labelUrl ? "text-primary hover:bg-primary/10" : "text-gray-200 cursor-not-allowed"
                            )}
                          >
                            <FiPaperclip className="h-4 w-4" />
                          </button>
                          <button onClick={() => { setSelectedOrder(o); setDetailOpen(true); }}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600">
                            <FiEye className="h-4 w-4" />
                          </button>
                          {showTrash ? (
                            <>
                              <button onClick={() => handleRowRestore(o.id)} title="Restaurar"
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-green-50 hover:text-green-600">
                                <FiRotateCcw className="h-4 w-4" />
                              </button>
                              <button onClick={() => handleRowDelete(o.id)} title="Excluir definitivamente"
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600">
                                <FiX className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <button onClick={() => handleRowTrash(o.id)} title="Mover pra lixeira"
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600">
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

      {/* Order Detail Modal */}
      {detailOpen && selectedOrder && (
        <OrderDetailModal order={selectedOrder} onClose={() => { setDetailOpen(false); setSelectedOrder(null); }} />
      )}

      {/* Excluir TODOS os pedidos — ação extrema, exige digitar a frase de confirmação */}
      {deleteAllOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setDeleteAllOpen(false); setDeleteAllText(""); }} />
          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-red-100 bg-white shadow-2xl">
            <div className="flex items-center gap-3 border-b border-gray-100 p-6">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500">
                <FiAlertOctagon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Excluir TODOS os pedidos</h3>
                <p className="text-xs text-gray-500">Ação irreversível — apaga {total} pedido(s) do banco de dados.</p>
              </div>
            </div>
            <div className="space-y-3 p-6">
              <p className="text-sm text-gray-600">
                Pra confirmar, digite exatamente <strong className="font-mono text-red-600">EXCLUIR TODOS OS PEDIDOS</strong> abaixo:
              </p>
              <input
                value={deleteAllText}
                onChange={(e) => setDeleteAllText(e.target.value)}
                placeholder="EXCLUIR TODOS OS PEDIDOS"
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-mono outline-none focus:border-red-400 focus:ring-1 focus:ring-red-200"
              />
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-gray-100 p-4">
              <button
                onClick={() => { setDeleteAllOpen(false); setDeleteAllText(""); }}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteAllConfirm}
                disabled={deleteAllText !== "EXCLUIR TODOS OS PEDIDOS" || deleteAllLoading}
                className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-40"
              >
                {deleteAllLoading ? <FiLoader className="h-4 w-4 animate-spin" /> : <FiAlertOctagon className="h-4 w-4" />}
                Excluir tudo
              </button>
            </div>
          </div>
        </div>
      )}

      {exportModalOpen && <ExportOrdersModal onClose={() => setExportModalOpen(false)} />}
      {bulkExportModalOpen && (
        <ExportOrdersModal
          onClose={() => setBulkExportModalOpen(false)}
          orders={(data?.orders || []).filter((o) => selectedIds.has(o.id))}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════
// ORDER DETAIL MODAL
// ═══════════════════════════════════════

function OrderDetailModal({ order, onClose }: { order: AdminOrder; onClose: () => void }) {
  const updateMut = useUpdateOrder();
  const buyLabelMut = useBuyShippingLabel();
  const [tracking, setTracking] = useState(order.trackingCode || "");
  const [notes, setNotes] = useState(order.notes || "");
  const [buyLabelError, setBuyLabelError] = useState("");
  const [localLabelUrl, setLocalLabelUrl] = useState(order.labelUrl);
  const st = orderStatusMap[order.status] || orderStatusMap.PENDING;

  const saveTracking = async () => {
    try { await updateMut.mutateAsync({ id: order.id, trackingCode: tracking }); } catch {}
  };

  const handleBuyLabel = async () => {
    setBuyLabelError("");
    try {
      const result = await buyLabelMut.mutateAsync(order.id);
      setLocalLabelUrl(result.labelUrl);
      if (result.trackingCode) setTracking(result.trackingCode);
    } catch (e: any) {
      setBuyLabelError(e.message);
    }
  };

  const saveNotes = async () => {
    try { await updateMut.mutateAsync({ id: order.id, notes }); } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-8 pb-8">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-3xl overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-gray-900">Pedido #{order.orderNumber}</h2>
              <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold", st.color)}>
                {st.label}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-gray-400">
              {formatDateTime(order.createdAt)}
              {order.legacyStatus && (
                <span className="ml-2 text-gray-300">· status original da loja antiga: <code className="font-mono">{order.legacyStatus}</code></span>
              )}
            </p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[65vh] overflow-y-auto p-6 space-y-6">
          {/* Client + Address */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-gray-100 p-4">
              <div className="flex items-center gap-2 mb-3">
                <FiUser className="h-4 w-4 text-gray-400" />
                <span className="text-xs font-semibold text-gray-500">Cliente</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">{order.user.name}</p>
              <p className="text-xs text-gray-500">{order.user.email}</p>
              {order.user.phone && <p className="text-xs text-gray-500">{order.user.phone}</p>}
              {(order.shippingSnapshot?.cpf || order.shippingSnapshot?.cnpj) && (
                <p className="text-xs text-gray-500">
                  {order.shippingSnapshot.cnpj ? `CNPJ: ${order.shippingSnapshot.cnpj}` : `CPF: ${order.shippingSnapshot.cpf}`}
                </p>
              )}
            </div>

            {(order.address || order.shippingSnapshot) && (
              <div className="rounded-xl border border-gray-100 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FiMapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-xs font-semibold text-gray-500">Endereço de Entrega</span>
                </div>
                {order.address ? (
                  <>
                    <p className="text-sm text-gray-900">{order.address.street}, {order.address.number}</p>
                    {order.address.complement && <p className="text-xs text-gray-500">{order.address.complement}</p>}
                    <p className="text-xs text-gray-500">{order.address.neighborhood} — {order.address.city}/{order.address.state}</p>
                    <p className="text-xs text-gray-500">CEP: {order.address.zipCode}</p>
                  </>
                ) : order.shippingSnapshot ? (
                  <>
                    <p className="text-sm text-gray-900">{order.shippingSnapshot.street}, {order.shippingSnapshot.number}</p>
                    {order.shippingSnapshot.complement && <p className="text-xs text-gray-500">{order.shippingSnapshot.complement}</p>}
                    <p className="text-xs text-gray-500">{order.shippingSnapshot.neighborhood} — {order.shippingSnapshot.city}/{order.shippingSnapshot.state}</p>
                    <p className="text-xs text-gray-500">CEP: {order.shippingSnapshot.zipCode}</p>
                  </>
                ) : null}
              </div>
            )}
          </div>

          {(order.recipientName || localLabelUrl || order.meServiceId) && (
            <div className="grid gap-4 sm:grid-cols-2">
              {order.recipientName && (
                <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <FiUser className="h-4 w-4 text-brand-500" />
                    <span className="text-xs font-semibold text-gray-500">Destinatário (diferente do comprador)</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{order.recipientName}</p>
                  {order.recipientDocument && <p className="text-xs text-gray-500">Doc: {order.recipientDocument}</p>}
                </div>
              )}
              {localLabelUrl ? (
                <div className="rounded-xl border border-gray-100 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <FiPaperclip className="h-4 w-4 text-primary" />
                    <span className="text-xs font-semibold text-gray-500">
                      {order.meServiceId ? "Etiqueta de Envio" : "Etiqueta Anexada pelo Cliente"}
                    </span>
                  </div>
                  <button
                    onClick={() => downloadFiles([{ url: localLabelUrl as string, name: `etiqueta-${order.orderNumber}` }])}
                    className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
                  >
                    <FiDownload className="h-4 w-4" /> Baixar Etiqueta
                  </button>
                </div>
              ) : order.meServiceId ? (
                <div className="rounded-xl border border-gray-100 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <FiTruck className="h-4 w-4 text-primary" />
                    <span className="text-xs font-semibold text-gray-500">
                      Envio: {order.shippingMethod || "Melhor Envio"}
                    </span>
                  </div>
                  {buyLabelError && <p className="mb-2 text-xs font-medium text-red-600">{buyLabelError}</p>}
                  <button
                    onClick={handleBuyLabel}
                    disabled={buyLabelMut.isPending}
                    className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
                  >
                    {buyLabelMut.isPending ? <FiLoader className="h-4 w-4 animate-spin" /> : <FiTruck className="h-4 w-4" />}
                    Comprar Etiqueta
                  </button>
                  <p className="mt-1.5 text-[10px] text-gray-400">Compra a etiqueta no Melhor Envio usando o saldo da conta conectada.</p>
                </div>
              ) : null}
            </div>
          )}

          {/* Items */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">Itens do Pedido</h3>
            <div className="divide-y divide-gray-100 rounded-xl border border-gray-100">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-gray-400 shrink-0">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="h-12 w-12 rounded-lg object-cover" />
                    ) : (
                      <FiPackage className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                    {item.variant && <p className="text-[11px] text-gray-400">{item.variant}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-gray-900">{formatBRL(item.price * item.quantity)}</p>
                    <p className="text-[11px] text-gray-400">{item.quantity}x {formatBRL(item.price)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="rounded-xl bg-gray-50 p-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span><span>{formatBRL(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>{order.shippingMethod || "Frete"}</span>
              <span>{order.shipping > 0 ? formatBRL(order.shipping) : "Grátis"}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Desconto {order.coupon && <code className="text-[10px] bg-green-100 px-1 rounded">{order.coupon.code}</code>}</span>
                <span>-{formatBRL(order.discount)}</span>
              </div>
            )}
            <div className="border-t border-gray-200 pt-2 flex justify-between text-base font-bold text-gray-900">
              <span>Total</span><span>{formatBRL(order.total)}</span>
            </div>
          </div>

          {/* Payment info */}
          <div className="rounded-xl border border-gray-100 p-4">
            <h3 className="mb-2 text-sm font-semibold text-gray-900">Pagamento</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-xs text-gray-400">Método</span>
                <p className="font-medium text-gray-700">{paymentMethodDisplay(order)}</p>
              </div>
              <div>
                <span className="text-xs text-gray-400">Status</span>
                <p className={cn("font-semibold", paymentStatusMap[order.paymentStatus]?.color)}>
                  {paymentStatusMap[order.paymentStatus]?.label || order.paymentStatus}
                </p>
              </div>
              {order.walletAmountUsed > 0 && (
                <div className="col-span-2 rounded-lg bg-brand-50 px-3 py-2">
                  <span className="text-xs text-brand-700">Pago com saldo da carteira</span>
                  <p className="font-semibold text-brand-800">
                    {formatBRL(order.walletAmountUsed)}
                    {order.walletAmountUsed < order.total && (
                      <span className="ml-1.5 font-normal text-brand-700">
                        (+ {formatBRL(order.total - order.walletAmountUsed)} via {paymentMethodLabels[order.paymentMethod || ""] || "outro método"})
                      </span>
                    )}
                  </p>
                </div>
              )}
              {order.paymentId && (
                <div className="col-span-2">
                  <span className="text-xs text-gray-400">ID Pagamento</span>
                  <p className="font-mono text-xs text-gray-600">{order.paymentId}</p>
                </div>
              )}
            </div>
          </div>

          {/* Tracking */}
          <div className="rounded-xl border border-gray-100 p-4">
            <h3 className="mb-2 text-sm font-semibold text-gray-900">Rastreamento</h3>
            <div className="flex gap-2">
              <input value={tracking} onChange={(e) => setTracking(e.target.value)}
                className="flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="Código de rastreamento" />
              <button onClick={saveTracking} disabled={updateMut.isPending}
                className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50">
                {updateMut.isPending ? "..." : "Salvar"}
              </button>
            </div>
          </div>

          {/* Notes */}
          <div className="rounded-xl border border-gray-100 p-4">
            <h3 className="mb-2 text-sm font-semibold text-gray-900">Observações Internas</h3>
            <div className="flex gap-2">
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                className="flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="Notas internas sobre o pedido..." />
              <button onClick={saveNotes} disabled={updateMut.isPending}
                className="self-end rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50">
                {updateMut.isPending ? "..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}