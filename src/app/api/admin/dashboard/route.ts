import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminPayload, unauthorized } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  const admin = getAdminPayload(req);
  if (!admin) return unauthorized();

  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // ── KPIs This Month ──
    const [
      ordersThisMonth,
      ordersLastMonth,
      customersThisMonth,
      customersLastMonth,
      totalProducts,
      totalCustomers,
      totalOrders,
      lowStockProducts,
      activeCoupons,
    ] = await Promise.all([
      prisma.order.findMany({
        where: { createdAt: { gte: startOfMonth } },
        select: { id: true, total: true, status: true, paymentMethod: true, createdAt: true },
      }),
      prisma.order.findMany({
        where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
        select: { id: true, total: true },
      }),
      prisma.user.count({
        where: { role: "CLIENT", createdAt: { gte: startOfMonth } },
      }),
      prisma.user.count({
        where: { role: "CLIENT", createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
      }),
      prisma.product.count({ where: { active: true } }),
      prisma.user.count({ where: { role: "CLIENT" } }),
      prisma.order.count(),
      prisma.product.count({ where: { active: true, stock: { lte: 5 }, manageStock: true } }),
      prisma.coupon.count({ where: { active: true } }),
    ]);

    const revenueThisMonth = ordersThisMonth.reduce((sum, o) => sum + o.total, 0);
    const revenueLastMonth = ordersLastMonth.reduce((sum, o) => sum + o.total, 0);
    const ordersCountThisMonth = ordersThisMonth.length;
    const ordersCountLastMonth = ordersLastMonth.length;
    const ticketThisMonth = ordersCountThisMonth > 0 ? revenueThisMonth / ordersCountThisMonth : 0;
    const ticketLastMonth = ordersCountLastMonth > 0 ? revenueLastMonth / ordersCountLastMonth : 0;

    const pctChange = (curr: number, prev: number) =>
      prev === 0 ? (curr > 0 ? 100 : 0) : Math.round(((curr - prev) / prev) * 1000) / 10;

    // ── Today stats ──
    const ordersToday = await prisma.order.findMany({
      where: { createdAt: { gte: startOfToday } },
      select: { total: true },
    });
    const revenueToday = ordersToday.reduce((sum, o) => sum + o.total, 0);
    const ordersCountToday = ordersToday.length;

    const pageViewsToday = await prisma.pageView.count({
      where: { createdAt: { gte: startOfToday } },
    });

    // ── Revenue last 12 months ──
    const revenueByMonth: { month: string; value: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const mStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const monthOrders = await prisma.order.findMany({
        where: { createdAt: { gte: mStart, lte: mEnd } },
        select: { total: true },
      });
      const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      revenueByMonth.push({
        month: monthNames[mStart.getMonth()],
        value: monthOrders.reduce((s, o) => s + o.total, 0),
      });
    }

    // ── Recent Orders ──
    const recentOrders = await prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true } },
        items: { select: { quantity: true } },
      },
    });

    // ── Top Products (by order items quantity) ──
    const topProductsRaw = await prisma.orderItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true, price: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    });
    const topProductIds = topProductsRaw.map((p) => p.productId).filter((id): id is string => id !== null);
    const topProductDetails = await prisma.product.findMany({
      where: { id: { in: topProductIds } },
      select: { id: true, name: true, price: true, images: { take: 1, select: { url: true } } },
    });
    const topProducts = topProductsRaw.map((raw) => {
      const detail = topProductDetails.find((p) => p.id === raw.productId);
      return {
        id: raw.productId,
        name: detail?.name || "Produto removido",
        image: detail?.images[0]?.url || null,
        sold: raw._sum.quantity || 0,
        revenue: (raw._sum.price || 0) * (raw._sum.quantity || 1),
      };
    });

    // ── Order Status Distribution ──
    const statusGroups = await prisma.order.groupBy({
      by: ["status"],
      _count: true,
    });

    // ── Recent Activity (last orders + new clients) ──
    const recentClients = await prisma.user.findMany({
      where: { role: "CLIENT" },
      take: 3,
      orderBy: { createdAt: "desc" },
      select: { name: true, createdAt: true },
    });

    return NextResponse.json({
      kpis: {
        revenue: { value: revenueThisMonth, change: pctChange(revenueThisMonth, revenueLastMonth) },
        orders: { value: ordersCountThisMonth, change: pctChange(ordersCountThisMonth, ordersCountLastMonth) },
        newCustomers: { value: customersThisMonth, change: pctChange(customersThisMonth, customersLastMonth) },
        avgTicket: { value: ticketThisMonth, change: pctChange(ticketThisMonth, ticketLastMonth) },
      },
      today: {
        revenue: revenueToday,
        orders: ordersCountToday,
        visitors: pageViewsToday,
        conversion: pageViewsToday > 0 ? Math.round((ordersCountToday / pageViewsToday) * 10000) / 100 : 0,
      },
      totals: { products: totalProducts, customers: totalCustomers, orders: totalOrders, lowStock: lowStockProducts, coupons: activeCoupons },
      revenueByMonth,
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customer: o.user.name,
        total: o.total,
        status: o.status,
        paymentMethod: o.paymentMethod,
        itemCount: o.items.reduce((s, i) => s + i.quantity, 0),
        createdAt: o.createdAt,
      })),
      topProducts,
      orderStatusDistribution: statusGroups.map((g) => ({ status: g.status, count: g._count })),
      recentClients,
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
