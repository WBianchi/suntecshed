"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FiTruck, FiLoader, FiSearch, FiPackage, FiCheck, FiClock } from "react-icons/fi";

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const statusSteps = [
  { key: "PENDING", label: "Pedido Realizado", icon: FiPackage },
  { key: "PAYMENT_CONFIRMED", label: "Pagamento Confirmado", icon: FiCheck },
  { key: "PROCESSING", label: "Em Preparo", icon: FiClock },
  { key: "SHIPPED", label: "Enviado", icon: FiTruck },
];

const statusOrder = ["PENDING", "AWAITING_PAYMENT", "PAYMENT_CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];

export function AccountTracking() {
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["user-orders"],
    queryFn: async () => {
      const res = await fetch("/api/orders", { credentials: "include" });
      if (!res.ok) return { orders: [] };
      return res.json();
    },
  });

  const orders = data?.orders || [];
  const activeOrders = orders.filter((o: any) => !["DELIVERED", "CANCELLED", "REFUNDED"].includes(o.status));

  const handleSearch = () => {
    const found = orders.find((o: any) => o.orderNumber.toLowerCase().includes(search.toLowerCase()));
    setSelectedOrder(found || null);
  };

  const tracked = selectedOrder || (activeOrders.length > 0 ? activeOrders[0] : null);
  const currentIdx = tracked ? statusOrder.indexOf(tracked.status) : -1;

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Buscar por número do pedido..."
            className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50/50 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10" />
        </div>
        <button onClick={handleSearch}
          className="rounded-xl bg-primary px-4 text-xs font-bold text-white hover:bg-primary/90">
          Buscar
        </button>
      </div>

      {!tracked ? (
        <div className="py-10 text-center">
          <FiTruck className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-3 text-sm font-medium text-gray-500">Nenhum pedido em andamento</p>
          <p className="mt-1 text-xs text-gray-400">Quando você fizer um pedido, poderá rastreá-lo aqui</p>
        </div>
      ) : (
        <div>
          <div className="mb-4 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
            <p className="text-xs text-primary/70">Rastreando pedido</p>
            <p className="text-lg font-extrabold text-primary">#{tracked.orderNumber}</p>
            <p className="text-xs text-gray-500">Realizado em {formatDate(tracked.createdAt)}</p>
          </div>

          {tracked.trackingCode && (
            <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5">
              <p className="text-xs text-blue-600">Código de rastreio: <span className="font-bold">{tracked.trackingCode}</span></p>
            </div>
          )}

          {/* Progress */}
          <div className="space-y-0">
            {statusSteps.map((step, i) => {
              const stepIdx = statusOrder.indexOf(step.key);
              const isCompleted = currentIdx >= stepIdx;
              const isCurrent = statusOrder[currentIdx] === step.key || (currentIdx === 1 && step.key === "PENDING");
              const StepIcon = step.icon;

              return (
                <div key={step.key} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
                      isCompleted ? "bg-primary text-white" : "border-2 border-gray-200 bg-white text-gray-300"
                    } ${isCurrent ? "ring-4 ring-primary/20" : ""}`}>
                      <StepIcon className="h-3.5 w-3.5" />
                    </div>
                    {i < statusSteps.length - 1 && (
                      <div className={`h-8 w-0.5 ${isCompleted ? "bg-primary" : "bg-gray-200"}`} />
                    )}
                  </div>
                  <div className="pb-6">
                    <p className={`text-sm font-semibold ${isCompleted ? "text-gray-900" : "text-gray-400"}`}>{step.label}</p>
                    {isCurrent && <p className="text-[10px] text-primary font-medium">Status atual</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Active orders list */}
      {activeOrders.length > 1 && (
        <div>
          <p className="mb-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Outros pedidos em andamento</p>
          <div className="space-y-2">
            {activeOrders.filter((o: any) => o.id !== tracked?.id).map((o: any) => (
              <button key={o.id} onClick={() => setSelectedOrder(o)}
                className="flex w-full items-center gap-3 rounded-xl border border-gray-100 px-3 py-2.5 text-left hover:bg-gray-50">
                <FiPackage className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-xs font-bold text-gray-900">#{o.orderNumber}</p>
                  <p className="text-[10px] text-gray-400">{formatDate(o.createdAt)}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
