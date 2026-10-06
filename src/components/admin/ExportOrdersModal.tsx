"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { AdminOrder } from "@/hooks/use-admin-orders";
import {
  FiX, FiDownload, FiLoader, FiMove, FiCalendar, FiChevronUp, FiChevronDown,
} from "react-icons/fi";

interface ExportOrdersModalProps {
  onClose: () => void;
  // Quando informado, exporta só esses pedidos (ex: seleção manual na
  // listagem) em vez de buscar pelos filtros de data/status abaixo.
  orders?: AdminOrder[];
}

const orderStatusMap: Record<string, string> = {
  PENDING: "Pendente",
  AWAITING_PAYMENT: "Aguardando Pgto",
  PAYMENT_CONFIRMED: "Pagamento Aprovado",
  PROCESSING: "Processando",
  SHIPPED: "Enviado",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
  REFUNDED: "Reembolsado",
  MISSING_LABEL: "Ausência de Etiqueta",
  ORDER_ERROR: "Erro no Pedido",
};

const paymentMethodLabels: Record<string, string> = {
  PIX: "PIX",
  BOLETO: "Boleto",
  CREDIT_CARD: "Cartão de Crédito",
  WALLET: "Carteira",
};

const paymentStatusLabels: Record<string, string> = {
  PENDING: "Pendente",
  CONFIRMED: "Confirmado",
  FAILED: "Falhou",
  REFUNDED: "Reembolsado",
  CANCELLED: "Cancelado",
};

function formatDateTime(d: string) {
  return new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

interface ExportField {
  key: string;
  label: string;
}

const EXPORT_FIELDS: ExportField[] = [
  { key: "orderNumber", label: "Pedido" },
  { key: "createdAt", label: "Data" },
  { key: "customerName", label: "Cliente" },
  { key: "customerEmail", label: "E-mail" },
  { key: "customerPhone", label: "Telefone" },
  { key: "productName", label: "Produto" },
  { key: "variant", label: "Variação" },
  { key: "quantity", label: "Quantidade" },
  { key: "shippingMethod", label: "Forma de Envio" },
  { key: "subtotal", label: "Subtotal" },
  { key: "shipping", label: "Frete" },
  { key: "discount", label: "Desconto" },
  { key: "total", label: "Total" },
  { key: "status", label: "Status" },
  { key: "paymentMethod", label: "Forma de Pagamento" },
  { key: "paymentStatus", label: "Status Pagamento" },
  { key: "trackingCode", label: "Rastreio" },
  { key: "labelUrl", label: "Etiqueta Anexada" },
  { key: "address", label: "Endereço" },
];

const DEFAULT_ENABLED = new Set([
  "orderNumber", "createdAt", "customerName", "customerEmail", "productName", "variant", "quantity", "total", "status", "trackingCode", "address",
]);

const STORAGE_KEY = "Suntecshed_export_orders_config";

function getFieldValue(o: AdminOrder, key: string): string {
  switch (key) {
    case "orderNumber": return o.orderNumber;
    case "createdAt": return formatDateTime(o.createdAt);
    case "customerName": return o.user?.name || "";
    case "customerEmail": return o.user?.email || "";
    case "customerPhone": return o.user?.phone || "";
    case "productName": return o.items.map((i) => i.name).join(" | ");
    case "variant": return o.items.map((i) => i.variant || "-").join(" | ");
    case "quantity": return o.items.map((i) => i.quantity).join(" | ");
    case "shippingMethod": return o.shippingMethod || "";
    case "subtotal": return o.subtotal.toFixed(2).replace(".", ",");
    case "shipping": return o.shipping.toFixed(2).replace(".", ",");
    case "discount": return o.discount.toFixed(2).replace(".", ",");
    case "total": return o.total.toFixed(2).replace(".", ",");
    case "status": return orderStatusMap[o.status] || o.status;
    case "paymentMethod": return o.paymentMethod ? (paymentMethodLabels[o.paymentMethod] || o.paymentMethod) : "";
    case "paymentStatus": return paymentStatusLabels[o.paymentStatus] || o.paymentStatus;
    case "trackingCode": return o.trackingCode || "";
    case "labelUrl": return o.labelUrl || "";
    case "address": return o.address
      ? `${o.address.street}, ${o.address.number} - ${o.address.neighborhood}, ${o.address.city}/${o.address.state}, ${o.address.zipCode}`
      : "";
    default: return "";
  }
}

interface SavedExportConfig {
  fileName?: string;
  statusFilter?: string;
  fieldOrder?: string[];
  enabledKeys?: string[];
}

function loadSavedConfig(): SavedExportConfig | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Reaplica a ordem/seleção salva da última exportação — campos que não
// existem mais são descartados, campos novos entram no fim com o padrão.
function buildInitialFields(saved: SavedExportConfig | null): (ExportField & { enabled: boolean })[] {
  if (!saved?.fieldOrder?.length) {
    return EXPORT_FIELDS.map((f) => ({ ...f, enabled: DEFAULT_ENABLED.has(f.key) }));
  }
  const byKey = new Map(EXPORT_FIELDS.map((f) => [f.key, f]));
  const enabledSet = new Set(saved.enabledKeys || []);
  const ordered: (ExportField & { enabled: boolean })[] = [];
  for (const key of saved.fieldOrder) {
    const f = byKey.get(key);
    if (f) {
      ordered.push({ ...f, enabled: enabledSet.has(key) });
      byKey.delete(key);
    }
  }
  for (const f of byKey.values()) {
    ordered.push({ ...f, enabled: DEFAULT_ENABLED.has(f.key) });
  }
  return ordered;
}

export function ExportOrdersModal({ onClose, orders: fixedOrders }: ExportOrdersModalProps) {
  const isFixedSelection = !!fixedOrders?.length;
  const [fileName, setFileName] = useState(() => loadSavedConfig()?.fileName || "pedidos-exportados");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  // Padrão pedido: exporta pedidos com pagamento aprovado — mas o admin
  // pode trocar pra qualquer outro status ou "Todos". Lembra a última escolha.
  const [statusFilter, setStatusFilter] = useState(() => loadSavedConfig()?.statusFilter ?? "PAYMENT_CONFIRMED");
  const [fields, setFields] = useState<(ExportField & { enabled: boolean })[]>(() => buildInitialFields(loadSavedConfig()));
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const dragIndex = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Salva a configuração (nome padrão, status, ordem/seleção de campos)
  // pra próxima vez que abrir o modal já vir do jeito que ficou.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        fileName,
        statusFilter,
        fieldOrder: fields.map((f) => f.key),
        enabledKeys: fields.filter((f) => f.enabled).map((f) => f.key),
      } satisfies SavedExportConfig));
    } catch {}
  }, [fileName, statusFilter, fields]);

  const enabledCount = fields.filter((f) => f.enabled).length;

  const toggleField = (key: string) => {
    setFields((prev) => prev.map((f) => (f.key === key ? { ...f, enabled: !f.enabled } : f)));
  };

  const handleDrop = (targetIndex: number) => {
    setDragOverIndex(null);
    const from = dragIndex.current;
    dragIndex.current = null;
    if (from === null || from === targetIndex) return;
    setFields((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
  };

  // Botões de mover pra cima/baixo — arrastar (draggable) não funciona em
  // touch (celular/tablet), então isso garante que reordenar funciona em
  // qualquer dispositivo, não só no mouse.
  const moveField = (index: number, direction: -1 | 1) => {
    setFields((prev) => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  };

  const handleExport = async () => {
    setError("");
    const activeFields = fields.filter((f) => f.enabled);
    if (activeFields.length === 0) {
      setError("Selecione ao menos um campo pra exportar");
      return;
    }

    setExporting(true);
    try {
      let orders: AdminOrder[];
      if (isFixedSelection) {
        orders = fixedOrders!;
      } else {
        const params = new URLSearchParams();
        if (dateFrom) params.set("dateFrom", dateFrom);
        if (dateTo) params.set("dateTo", dateTo);
        if (statusFilter) params.set("status", statusFilter);
        params.set("sort", "createdAt");
        params.set("order", "desc");
        params.set("limit", "20000");
        params.set("page", "1");

        const res = await fetch(`/api/admin/orders?${params}`);
        const json = await res.json();
        orders = json.orders || [];
      }

      if (orders.length === 0) {
        setError("Nenhum pedido encontrado com esses filtros");
        return;
      }

      const headers = activeFields.map((f) => f.label);
      const rows = orders.map((o) => activeFields.map((f) => getFieldValue(o, f.key)));
      const csvLines = [
        headers.join(";"),
        ...rows.map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(";")),
      ];
      const csv = "﻿" + csvLines.join("\r\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName.trim() || "pedidos-exportados"}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onClose();
    } catch {
      setError("Erro ao gerar a exportação. Tente novamente.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-8 pb-8">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900">Configurar Exportação</h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[70vh] space-y-4 overflow-y-auto p-6">
          {error && <div className="rounded-xl bg-red-50 p-3 text-xs font-medium text-red-600">{error}</div>}

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-600">Nome do Arquivo</label>
            <div className="flex items-center gap-2">
              <input value={fileName} onChange={(e) => setFileName(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary" />
              <span className="shrink-0 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs font-semibold text-gray-500">.csv</span>
            </div>
          </div>

          {isFixedSelection ? (
            <div className="rounded-xl bg-primary/5 px-3 py-2.5 text-xs font-medium text-primary">
              Exportando {fixedOrders!.length} pedido(s) selecionado(s) na listagem.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                    <FiCalendar className="h-3.5 w-3.5" /> Data Inicial
                  </label>
                  <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                    <FiCalendar className="h-3.5 w-3.5" /> Data Final
                  </label>
                  <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-primary" />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-600">Status do Pedido</label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-primary">
                  <option value="">Todos os Status</option>
                  {Object.entries(orderStatusMap).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-semibold text-gray-600">Campos para Exportar</label>
              <span className="text-[11px] text-gray-400">{enabledCount} campos selecionados</span>
            </div>
            <div className="max-h-64 space-y-1.5 overflow-y-auto rounded-xl border border-gray-100 p-2">
              {fields.map((f, i) => (
                <div
                  key={f.key}
                  draggable
                  onDragStart={() => { dragIndex.current = i; }}
                  onDragOver={(e) => { e.preventDefault(); setDragOverIndex(i); }}
                  onDragLeave={() => setDragOverIndex((v) => (v === i ? null : v))}
                  onDrop={() => handleDrop(i)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl border px-3 py-2.5 transition-colors",
                    dragOverIndex === i ? "border-primary bg-primary/5" : "border-gray-100 bg-white"
                  )}
                >
                  <FiMove className="hidden h-4 w-4 shrink-0 cursor-grab text-gray-300 sm:block" />
                  <label className="flex flex-1 items-center gap-2.5 text-sm text-gray-700">
                    <input type="checkbox" checked={f.enabled} onChange={() => toggleField(f.key)}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                    {f.label}
                  </label>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <button type="button" onClick={() => moveField(i, -1)} disabled={i === 0}
                      className="flex h-6 w-6 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30">
                      <FiChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={() => moveField(i, 1)} disabled={i === fields.length - 1}
                      className="flex h-6 w-6 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30">
                      <FiChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-1.5 text-[10px] text-gray-400">Use as setinhas (ou arraste, no computador) para reordenar. Marque ou desmarque para incluir/excluir.</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button onClick={onClose} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
            Cancelar
          </button>
          <button onClick={handleExport} disabled={exporting}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50">
            {exporting ? <FiLoader className="h-4 w-4 animate-spin" /> : <FiDownload className="h-4 w-4" />}
            Exportar CSV
          </button>
        </div>
      </div>
    </div>
  );
}
