"use client";

import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { FiPackage, FiLoader, FiChevronDown, FiChevronUp, FiChevronLeft, FiChevronRight, FiEye, FiClock, FiCheck, FiTruck, FiX, FiSearch, FiUpload, FiPaperclip } from "react-icons/fi";
import Image from "next/image";
import Link from "next/link";

function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: "Pendente", color: "bg-yellow-100 text-yellow-700", icon: FiClock },
  AWAITING_PAYMENT: { label: "Aguardando Pagamento", color: "bg-orange-100 text-orange-700", icon: FiClock },
  PAYMENT_CONFIRMED: { label: "Pagamento Confirmado", color: "bg-blue-100 text-blue-700", icon: FiCheck },
  PROCESSING: { label: "Em Preparo", color: "bg-indigo-100 text-indigo-700", icon: FiPackage },
  SHIPPED: { label: "Enviado", color: "bg-cyan-100 text-cyan-700", icon: FiTruck },
  DELIVERED: { label: "Entregue", color: "bg-green-100 text-green-700", icon: FiCheck },
  CANCELLED: { label: "Cancelado", color: "bg-red-100 text-red-700", icon: FiX },
  REFUNDED: { label: "Reembolsado", color: "bg-gray-100 text-gray-600", icon: FiX },
  MISSING_LABEL: { label: "Aguardando Etiqueta de Envio", color: "bg-amber-100 text-amber-700", icon: FiClock },
  ORDER_ERROR: { label: "Pedido em Análise", color: "bg-red-100 text-red-800", icon: FiX },
};

const paymentLabels: Record<string, string> = {
  PIX: "PIX",
  CREDIT_CARD: "Cartão de Crédito",
  BOLETO: "Boleto Bancário",
};

const PAGE_SIZE = 10;

// Upload da etiqueta pra quem esqueceu de anexar no checkout — sobe o
// arquivo e já vincula ao pedido, atualizando a lista em seguida.
function AttachLabelButton({ orderId }: { orderId: string }) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch("/api/checkout/upload-label", { method: "POST", body: formData, credentials: "include" });
      const uploadJson = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadJson.error || "Erro ao enviar arquivo");

      const attachRes = await fetch(`/api/orders/${orderId}/attach-label`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ labelUrl: uploadJson.url, labelName: uploadJson.name }),
      });
      const attachJson = await attachRes.json();
      if (!attachRes.ok) throw new Error(attachJson.error || "Erro ao anexar etiqueta");
      return attachJson;
    },
    onSuccess: () => {
      setError("");
      queryClient.invalidateQueries({ queryKey: ["user-orders"] });
    },
    onError: (e: any) => setError(e.message || "Erro ao anexar etiqueta"),
  });

  return (
    <div className="mt-3 rounded-xl border border-dashed border-gray-200 p-3">
      <p className="text-xs font-medium text-gray-600">Esqueceu de anexar a etiqueta de envio no pedido?</p>
      <button
        onClick={() => inputRef.current?.click()}
        disabled={mutation.isPending}
        className="mt-2 flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200 disabled:opacity-50"
      >
        {mutation.isPending ? <FiLoader className="h-3.5 w-3.5 animate-spin" /> : <FiUpload className="h-3.5 w-3.5" />}
        {mutation.isPending ? "Enviando..." : "Anexar etiqueta agora"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) mutation.mutate(file);
          e.target.value = "";
        }}
      />
      {error && <p className="mt-1.5 text-[11px] text-red-500">{error}</p>}
    </div>
  );
}

export function AccountOrders() {
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchDebounced(value.trim());
      setPage(1);
    }, 400);
  };

  const { data, isLoading, isPlaceholderData } = useQuery({
    queryKey: ["user-orders", page, searchDebounced],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (searchDebounced) params.set("search", searchDebounced);
      const res = await fetch(`/api/orders?${params}`, { credentials: "include" });
      if (!res.ok) throw new Error("Erro");
      return res.json();
    },
    placeholderData: keepPreviousData,
  });

  const orders = data?.orders || [];
  const totalPages = data?.totalPages || 1;
  const total = data?.total ?? orders.length;

  const searchBar = (
    <div className="relative">
      <FiSearch className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        value={search}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Buscar por número do pedido, produto ou rastreio..."
        className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-10 pr-4 text-sm outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
      />
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {searchBar}
        <div className="flex items-center justify-center py-12">
          <FiLoader className="h-6 w-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="space-y-4">
        {searchBar}
        <div className="py-12 text-center">
          <FiPackage className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-500">
            {searchDebounced ? "Nenhum pedido encontrado para essa busca" : "Nenhum pedido encontrado"}
          </p>
          {!searchDebounced && (
            <Link href="/produtos" className="mt-4 inline-block rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white hover:bg-primary/90">
              Explorar Produtos
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {searchBar}
      {orders.map((order: any) => {
        const st = statusConfig[order.status] || statusConfig.PENDING;
        const isOpen = expandedOrder === order.id;
        const StIcon = st.icon;

        return (
          <div key={order.id} className="overflow-hidden rounded-[22px] border border-gray-100 bg-white transition-all">
            {/* Order header */}
            <button onClick={() => setExpandedOrder(isOpen ? null : order.id)}
              className="flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-gray-50/50">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/5">
                <StIcon className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-gray-900">#{order.orderNumber}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${st.color}`}>{st.label}</span>
                </div>
                <p className="text-xs text-gray-500">
                  {formatDate(order.createdAt)} · {order.items.length} {order.items.length === 1 ? "item" : "itens"} · {formatCurrency(order.total)}
                </p>
              </div>
              <div className="shrink-0 text-gray-400">
                {isOpen ? <FiChevronUp className="h-4 w-4" /> : <FiChevronDown className="h-4 w-4" />}
              </div>
            </button>

            {/* Expanded details */}
            {isOpen && (
              <div className="border-t border-gray-100 px-4 py-4">
                {/* Items */}
                <div className="space-y-2">
                  {order.items.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-white">
                        {item.image ? (
                          <Image src={item.image} alt={item.name} fill sizes="48px" className="object-contain p-1" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center"><FiPackage className="h-4 w-4 text-gray-300" /></div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-gray-900">{item.name}</p>
                        {item.variant && <p className="text-[10px] text-gray-400">{item.variant}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-gray-900">{formatCurrency(item.price * item.quantity)}</p>
                        <p className="text-[10px] text-gray-400">{item.quantity}x {formatCurrency(item.price)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div className="mt-4 space-y-1.5 border-t border-gray-100 pt-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="text-gray-700">{formatCurrency(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Frete</span>
                    <span className={order.shipping === 0 ? "text-green-600 font-medium" : "text-gray-700"}>
                      {order.shipping === 0 ? "Grátis" : formatCurrency(order.shipping)}
                    </span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-green-600">Desconto</span>
                      <span className="font-medium text-green-600">- {formatCurrency(order.discount)}</span>
                    </div>
                  )}
                  {order.walletAmountUsed > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-amber-600">Pago com saldo da carteira</span>
                      <span className="font-medium text-amber-600">- {formatCurrency(order.walletAmountUsed)}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-gray-100 pt-2 text-sm">
                    <span className="font-bold text-gray-900">Total</span>
                    <span className="font-extrabold text-gray-900">{formatCurrency(order.total)}</span>
                  </div>
                </div>

                {/* Payment & tracking */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {order.paymentMethod && (
                    <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-[10px] font-medium text-gray-600">
                      {paymentLabels[order.paymentMethod] || order.paymentMethod}
                    </span>
                  )}
                  {order.trackingCode && (
                    <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-[10px] font-medium text-blue-600">
                      Rastreio: {order.trackingCode}
                    </span>
                  )}
                  {order.labelUrl && (
                    <a href={order.labelUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-[10px] font-medium text-amber-700 hover:underline">
                      <FiPaperclip className="h-3 w-3" /> Ver etiqueta anexada
                    </a>
                  )}
                </div>

                {!order.labelUrl && !["CANCELLED", "REFUNDED", "DELIVERED"].includes(order.status) && (
                  <AttachLabelButton orderId={order.id} />
                )}
              </div>
            )}
          </div>
        );
      })}

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-100 pt-3">
          <p className="text-xs text-gray-400">
            Página {page} de {totalPages} · {total} pedidos
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || isPlaceholderData}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 disabled:opacity-40"
            >
              <FiChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || isPlaceholderData}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 disabled:opacity-40"
            >
              <FiChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
