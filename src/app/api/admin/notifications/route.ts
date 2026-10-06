import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminPayload, unauthorized } from "@/lib/admin-auth";

function formatBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

export async function GET(req: NextRequest) {
  const admin = getAdminPayload(req);
  if (!admin) return unauthorized();

  try {
    const [recentOrders, stockCandidates, activeCoupons, productLogs] = await Promise.all([
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true,
          orderNumber: true,
          total: true,
          paymentStatus: true,
          createdAt: true,
          user: { select: { name: true } },
        },
      }),
      prisma.product.findMany({
        where: { active: true, manageStock: true },
        select: { id: true, name: true, stock: true, lowStockAlert: true, updatedAt: true },
      }),
      prisma.coupon.findMany({
        where: { active: true, endDate: { not: null } },
        select: { code: true, endDate: true },
        orderBy: { endDate: "asc" },
        take: 3,
      }),
      prisma.productLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 30,
      }),
    ]);

    const lowStock = stockCandidates
      .filter((p) => p.stock <= p.lowStockAlert)
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 4);

    const now = Date.now();
    const soon = new Date(now + 3 * 24 * 60 * 60 * 1000);
    const expiringCoupons = activeCoupons.filter((c) => c.endDate && c.endDate <= soon);

    type Notification = {
      id: string;
      type: "order" | "alert" | "success" | "stock_change" | "price_change" | "stock_out";
      title: string;
      desc: string;
      timestamp: string;
    };

    const notifications: Notification[] = [
      ...recentOrders.map((o): Notification => ({
        id: `order-${o.id}`,
        type: o.paymentStatus === "CONFIRMED" ? "success" : "order",
        title:
          o.paymentStatus === "CONFIRMED"
            ? `Pagamento confirmado — #${o.orderNumber}`
            : `Novo pedido #${o.orderNumber}`,
        desc: `${o.user?.name || "Cliente"} — ${formatBRL(o.total)}`,
        timestamp: o.createdAt.toISOString(),
      })),
      ...lowStock.map((p): Notification => ({
        id: `stock-${p.id}`,
        type: "alert",
        title: "Estoque baixo",
        desc: `${p.name} com apenas ${p.stock} unidade${p.stock === 1 ? "" : "s"}`,
        timestamp: p.updatedAt.toISOString(),
      })),
      ...productLogs.map((log): Notification => {
        if (log.type === "PRICE_CHANGE") {
          const diff = log.newValue - log.oldValue;
          const pct = ((diff / log.oldValue) * 100);
          const pctStr = pct >= 0
            ? `${pct.toFixed(1)}% de aumento`
            : `${Math.abs(pct).toFixed(1)}% de desconto`;
          return {
            id: `productlog-${log.id}`,
            type: "price_change" as const,
            title: "Reajuste de Preço",
            desc: `${log.productName}: de ${formatBRL(log.oldValue)} para ${formatBRL(log.newValue)} (${pctStr})`,
            timestamp: log.createdAt.toISOString(),
          };
        }
        if (log.type === "STOCK_OUT") {
          return {
            id: `productlog-${log.id}`,
            type: "stock_out" as const,
            title: "Produto sem estoque",
            desc: `${log.productName}: o produto está sem estoque (era ${Math.round(log.oldValue)} unidades)`,
            timestamp: log.createdAt.toISOString(),
          };
        }
        // STOCK_CHANGE
        return {
          id: `productlog-${log.id}`,
          type: "stock_change" as const,
          title: "Alteração de Estoque",
          desc: `${log.productName}: de ${Math.round(log.oldValue)} para ${Math.round(log.newValue)} unidades`,
          timestamp: log.createdAt.toISOString(),
        };
      }),
      ...expiringCoupons.map((c): Notification => ({
        id: `coupon-${c.code}`,
        type: "alert",
        title: "Cupom expirando",
        desc: `${c.code} expira em breve`,
        timestamp: new Date(now).toISOString(),
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    const unreadCount = notifications.filter(
      (n) => now - new Date(n.timestamp).getTime() < 24 * 60 * 60 * 1000
    ).length;

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error("Admin notifications error:", error);
    return NextResponse.json({ error: "Erro ao buscar notificações" }, { status: 500 });
  }
}
