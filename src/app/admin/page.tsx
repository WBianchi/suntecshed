"use client";

import { useAuth } from "@/providers/auth-provider";
import { useAdminDashboard } from "@/hooks/use-admin-dashboard";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { KpiCard } from "@/components/admin/ui/KpiCard";
import { StatusBadge } from "@/components/admin/ui/StatusBadge";
import { RevenueChart } from "@/components/admin/ui/RevenueChart";
import { MiniBar } from "@/components/admin/ui/MiniBar";
import {
  FiDollarSign, FiShoppingCart, FiUsers, FiBarChart2,
  FiRefreshCw, FiCalendar, FiChevronRight, FiMoreVertical,
  FiShoppingBag, FiEye, FiTrendingUp, FiPackage, FiCreditCard,
  FiTruck, FiAlertCircle, FiUserPlus, FiBox, FiTag,
} from "react-icons/fi";

function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins} min atrás`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  return `${days}d atrás`;
}

const paymentLabels: Record<string, string> = {
  PIX: "PIX",
  CREDIT_CARD: "Cartão",
  BOLETO: "Boleto",
  WALLET: "Carteira",
};

const statusColors: Record<string, string> = {
  PENDING: "bg-gray-400",
  AWAITING_PAYMENT: "bg-yellow-500",
  PAYMENT_CONFIRMED: "bg-green-500",
  PROCESSING: "bg-brand-500",
  SHIPPED: "bg-blue-500",
  DELIVERED: "bg-emerald-500",
  CANCELLED: "bg-red-400",
  REFUNDED: "bg-purple-400",
  MISSING_LABEL: "bg-brand-500",
  ORDER_ERROR: "bg-red-600",
};

const statusLabels: Record<string, string> = {
  PENDING: "Pendente",
  AWAITING_PAYMENT: "Aguard. Pagto",
  PAYMENT_CONFIRMED: "Pago",
  PROCESSING: "Processando",
  SHIPPED: "Enviado",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
  REFUNDED: "Reembolsado",
  MISSING_LABEL: "Sem Etiqueta",
  ORDER_ERROR: "Erro no Pedido",
};

// ─── Skeleton Loader ─────────────────────────────────
function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-gray-200", className)} />;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-60" />
        </div>
        <Skeleton className="h-9 w-48" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl border border-gray-100 bg-white p-5">
            <Skeleton className="h-12 w-12 rounded-2xl" />
            <Skeleton className="mt-4 h-8 w-32" />
            <Skeleton className="mt-2 h-4 w-24" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 xl:col-span-2">
          <Skeleton className="h-48 w-full" />
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-5">
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard Page ──────────────────────────────────
export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const { data, isLoading, refetch } = useAdminDashboard();

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (user?.role !== "ADMIN") {
    return (
      <div className="py-32 text-center">
        <p className="text-gray-500">Acesso restrito a administradores.</p>
        <Link href="/" className="mt-4 inline-block rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white">
          Voltar à Loja
        </Link>
      </div>
    );
  }

  if (isLoading || !data) return <DashboardSkeleton />;

  const { kpis, today, totals, revenueByMonth, recentOrders, topProducts, orderStatusDistribution, recentClients } = data;
  const totalOrdersInDistribution = orderStatusDistribution.reduce((s, d) => s + d.count, 0) || 1;

  // Build activity feed from real data
  const activityItems = [
    ...recentOrders.slice(0, 3).map((o) => ({
      icon: FiShoppingCart,
      color: "bg-blue-50 text-blue-500",
      text: `Pedido #${o.orderNumber} — ${o.customer} — ${formatBRL(o.total)}`,
      time: timeAgo(o.createdAt),
    })),
    ...recentClients.map((c) => ({
      icon: FiUserPlus,
      color: "bg-purple-50 text-purple-500",
      text: `Novo cliente cadastrado: ${c.name}`,
      time: timeAgo(c.createdAt),
    })),
  ].sort((a, b) => {
    const parseTime = (t: string) => {
      if (t === "agora") return 0;
      const n = parseInt(t);
      if (t.includes("min")) return n;
      if (t.includes("h")) return n * 60;
      return n * 1440;
    };
    return parseTime(a.time) - parseTime(b.time);
  });

  const monthlyGoal = 55000;
  const goalPct = Math.min(Math.round((kpis.revenue.value / monthlyGoal) * 100), 100);

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Visão Geral</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Bem-vindo de volta, <span className="font-semibold text-primary">{user.name}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition-all hover:text-gray-700"
          >
            <FiRefreshCw className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600">
            <FiCalendar className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">
              {new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
            </span>
          </div>
        </div>
      </div>

      {/* ── Quick Totals ── */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: "Produtos ativos", value: totals.products, icon: FiBox, cls: "text-blue-600 bg-blue-50" },
          { label: "Clientes", value: totals.customers, icon: FiUsers, cls: "text-purple-600 bg-purple-50" },
          { label: "Pedidos total", value: totals.orders, icon: FiPackage, cls: "text-green-600 bg-green-50" },
          { label: "Estoque baixo", value: totals.lowStock, icon: FiAlertCircle, cls: totals.lowStock > 0 ? "text-red-600 bg-red-50" : "text-gray-600 bg-gray-50" },
          { label: "Cupons ativos", value: totals.coupons, icon: FiTag, cls: "text-brand-600 bg-brand-50" },
        ].map((t) => (
          <div key={t.label} className="flex items-center gap-2 rounded-xl border border-gray-100 bg-white px-3 py-2">
            <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg", t.cls)}>
              <t.icon className="h-3.5 w-3.5" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">{t.value}</p>
              <p className="text-[10px] text-gray-400">{t.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Receita do Mês"
          value={formatBRL(kpis.revenue.value)}
          change={kpis.revenue.change}
          icon={FiDollarSign}
          iconBg="bg-green-50 text-green-600"
        />
        <KpiCard
          title="Pedidos do Mês"
          value={String(kpis.orders.value)}
          change={kpis.orders.change}
          icon={FiShoppingCart}
          iconBg="bg-blue-50 text-blue-600"
        />
        <KpiCard
          title="Novos Clientes"
          value={String(kpis.newCustomers.value)}
          change={kpis.newCustomers.change}
          icon={FiUsers}
          iconBg="bg-purple-50 text-purple-600"
        />
        <KpiCard
          title="Ticket Médio"
          value={formatBRL(kpis.avgTicket.value)}
          change={kpis.avgTicket.change}
          icon={FiBarChart2}
          iconBg="bg-brand-50 text-brand-600"
        />
      </div>

      {/* ── Revenue Chart + Quick Stats ── */}
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Receita Mensal</h2>
              <p className="mt-0.5 text-xs text-gray-500">Evolução de faturamento — últimos 12 meses</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                Receita
              </span>
            </div>
          </div>
          <RevenueChart data={revenueByMonth} />
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-5">
            <h3 className="text-sm font-semibold text-gray-900">Resumo do Dia</h3>
            <div className="mt-4 space-y-4">
              {[
                { label: "Vendas hoje", value: formatBRL(today.revenue), icon: FiDollarSign, color: "text-green-500" },
                { label: "Pedidos hoje", value: String(today.orders), icon: FiShoppingBag, color: "text-blue-500" },
                { label: "Visitantes", value: String(today.visitors), icon: FiEye, color: "text-purple-500" },
                { label: "Taxa de conversão", value: `${today.conversion}%`, icon: FiTrendingUp, color: "text-brand-500" },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50", stat.color)}>
                      <stat.icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-sm text-gray-600">{stat.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-primary to-primary/80 p-5 text-white">
            <h3 className="text-sm font-semibold">Meta do Mês</h3>
            <p className="mt-1 text-2xl font-bold">{goalPct}%</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20">
              <div className="h-full rounded-full bg-white transition-all" style={{ width: `${goalPct}%` }} />
            </div>
            <p className="mt-2 text-xs text-white/70">{formatBRL(kpis.revenue.value)} de {formatBRL(monthlyGoal)}</p>
          </div>
        </div>
      </div>

      {/* ── Recent Orders + Top Products ── */}
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white xl:col-span-2">
          <div className="flex items-center justify-between border-b border-gray-100 p-5">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Pedidos Recentes</h2>
              <p className="mt-0.5 text-xs text-gray-500">Últimas transações da loja</p>
            </div>
            <Link href="/admin/vendas/pedidos" className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
              Ver todos <FiChevronRight className="h-3 w-3" />
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="p-10 text-center">
              <FiPackage className="mx-auto h-8 w-8 text-gray-300" />
              <p className="mt-2 text-sm text-gray-400">Nenhum pedido encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                    <th className="px-5 py-3">Pedido</th>
                    <th className="px-5 py-3">Cliente</th>
                    <th className="px-5 py-3">Total</th>
                    <th className="px-5 py-3">Pagamento</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-50 transition-colors last:border-0 hover:bg-gray-50/50">
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-semibold text-gray-900">#{order.orderNumber}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div>
                          <p className="text-sm text-gray-700">{order.customer}</p>
                          <p className="text-[11px] text-gray-400">{order.itemCount} {order.itemCount > 1 ? "itens" : "item"}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-semibold text-gray-900">{formatBRL(order.total)}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs text-gray-500">{paymentLabels[order.paymentMethod || ""] || "—"}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs text-gray-400">{timeAgo(order.createdAt)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="rounded-2xl border border-gray-100 bg-white">
          <div className="flex items-center justify-between border-b border-gray-100 p-5">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Top Produtos</h2>
              <p className="mt-0.5 text-xs text-gray-500">Mais vendidos</p>
            </div>
            <Link href="/admin/relatorios/produtos" className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
              Ver todos <FiChevronRight className="h-3 w-3" />
            </Link>
          </div>
          {topProducts.length === 0 ? (
            <div className="p-10 text-center">
              <FiBox className="mx-auto h-8 w-8 text-gray-300" />
              <p className="mt-2 text-sm text-gray-400">Sem vendas ainda</p>
            </div>
          ) : (
            <div className="p-2">
              {topProducts.map((product, i) => (
                <div key={product.id} className="flex items-center gap-3 rounded-xl p-3 transition-all hover:bg-gray-50">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-xs font-bold text-gray-500">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-700">{product.name}</p>
                    <p className="text-[11px] text-gray-400">{product.sold} vendidos</p>
                  </div>
                  <span className="text-xs font-semibold text-gray-900">{formatBRL(product.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Activity Feed + Order Status Distribution ── */}
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white xl:col-span-2">
          <div className="flex items-center justify-between border-b border-gray-100 p-5">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Atividade Recente</h2>
              <p className="mt-0.5 text-xs text-gray-500">Timeline de eventos da loja</p>
            </div>
          </div>
          <div className="p-5">
            {activityItems.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-400">Nenhuma atividade recente</p>
            ) : (
              <div className="space-y-1">
                {activityItems.map((act, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-xl p-3 transition-all hover:bg-gray-50">
                    <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", act.color)}>
                      <act.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-700">{act.text}</p>
                      <p className="mt-0.5 text-[11px] text-gray-400">{act.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Order Status Distribution */}
        <div className="rounded-2xl border border-gray-100 bg-white">
          <div className="border-b border-gray-100 p-5">
            <h2 className="text-sm font-semibold text-gray-900">Status dos Pedidos</h2>
            <p className="mt-0.5 text-xs text-gray-500">Distribuição atual</p>
          </div>
          <div className="p-5">
            {orderStatusDistribution.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-400">Sem pedidos</p>
            ) : (
              orderStatusDistribution.map((s) => (
                <div key={s.status} className="mb-4 last:mb-0">
                  <div className="mb-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={cn("h-2.5 w-2.5 rounded-full", statusColors[s.status] || "bg-gray-400")} />
                      <span className="text-sm text-gray-600">{statusLabels[s.status] || s.status}</span>
                    </div>
                    <span className="text-xs font-semibold text-gray-900">{s.count}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={cn("h-full rounded-full transition-all", statusColors[s.status] || "bg-gray-400")}
                      style={{ width: `${(s.count / totalOrdersInDistribution) * 100}%` }}
                    />
                  </div>
                </div>
              ))
            )}

            {/* Conversion funnel from real data */}
            <div className="mt-6 rounded-xl bg-gray-50 p-4">
              <h4 className="text-xs font-semibold text-gray-700">Resumo Geral</h4>
              <div className="mt-3 space-y-2">
                {[
                  { label: "Visitantes hoje", value: today.visitors },
                  { label: "Pedidos hoje", value: today.orders },
                  { label: "Pedidos no mês", value: kpis.orders.value },
                  { label: "Total de pedidos", value: totals.orders },
                ].map((f) => (
                  <div key={f.label} className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">{f.label}</span>
                    <span className="font-semibold text-gray-900">{f.value.toLocaleString("pt-BR")}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
