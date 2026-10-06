"use client";

import { cn } from "@/lib/utils";
import { FiClock, FiCheckCircle, FiTruck, FiXCircle, FiDollarSign, FiLoader, FiRotateCcw } from "react-icons/fi";

const statusConfig: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; cls: string }> = {
  PENDING: { label: "Pendente", icon: FiClock, cls: "bg-gray-100 text-gray-600" },
  AWAITING_PAYMENT: { label: "Aguard. Pagamento", icon: FiDollarSign, cls: "bg-yellow-50 text-yellow-600" },
  PAYMENT_CONFIRMED: { label: "Pago", icon: FiCheckCircle, cls: "bg-green-50 text-green-600" },
  PROCESSING: { label: "Processando", icon: FiLoader, cls: "bg-amber-50 text-amber-600" },
  SHIPPED: { label: "Enviado", icon: FiTruck, cls: "bg-blue-50 text-blue-600" },
  DELIVERED: { label: "Entregue", icon: FiCheckCircle, cls: "bg-emerald-50 text-emerald-600" },
  CANCELLED: { label: "Cancelado", icon: FiXCircle, cls: "bg-red-50 text-red-500" },
  REFUNDED: { label: "Reembolsado", icon: FiRotateCcw, cls: "bg-purple-50 text-purple-500" },
};

export function StatusBadge({ status }: { status: string }) {
  const c = statusConfig[status] || statusConfig.PENDING;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold", c.cls)}>
      <c.icon className="h-3 w-3" />
      {c.label}
    </span>
  );
}
