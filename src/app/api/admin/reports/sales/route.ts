import { NextRequest, NextResponse } from "next/server";
import { getAdminPayload, unauthorized } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { resolveReportPeriod } from "@/lib/report-period";

export async function GET(req: NextRequest) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  const url = new URL(req.url);
  const period = url.searchParams.get("period") || "30d";
  const { since, until } = resolveReportPeriod(period);

  const [
    totalOrders,
    confirmedOrders,
    cancelledOrders,
    totalRevenue,
    avgOrder,
    dailyData,
    paymentMethods,
    statusBreakdown,
    couponUsage,
  ] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: since, lte: until } } }),
    prisma.order.count({ where: { createdAt: { gte: since, lte: until }, paymentStatus: "CONFIRMED" } }),
    prisma.order.count({ where: { createdAt: { gte: since, lte: until }, status: "CANCELLED" } }),
    prisma.order.aggregate({ where: { createdAt: { gte: since, lte: until }, paymentStatus: "CONFIRMED" }, _sum: { total: true, discount: true, shipping: true } }),
    prisma.order.aggregate({ where: { createdAt: { gte: since, lte: until }, paymentStatus: "CONFIRMED" }, _avg: { total: true } }),
    prisma.$queryRaw`
      SELECT DATE("createdAt") as date, COUNT(*)::int as orders,
        COALESCE(SUM(total), 0)::float as revenue,
        COALESCE(SUM(CASE WHEN "paymentStatus" = 'CONFIRMED' THEN total ELSE 0 END), 0)::float as confirmed_revenue
      FROM orders WHERE "createdAt" >= ${since} AND "createdAt" <= ${until}
      GROUP BY DATE("createdAt") ORDER BY date ASC
    ` as Promise<any[]>,
    prisma.order.groupBy({
      by: ["paymentMethod"],
      where: { createdAt: { gte: since, lte: until }, paymentMethod: { not: null } },
      _count: true,
      _sum: { total: true },
    }),
    prisma.order.groupBy({
      by: ["status"],
      where: { createdAt: { gte: since, lte: until } },
      _count: true,
    }),
    prisma.order.groupBy({
      by: ["couponId"],
      where: { createdAt: { gte: since, lte: until }, couponId: { not: null } },
      _count: true,
      _sum: { discount: true },
    }),
  ]);

  const couponIds = couponUsage.map((c) => c.couponId!);
  const coupons = couponIds.length > 0
    ? await prisma.coupon.findMany({ where: { id: { in: couponIds } }, select: { id: true, code: true, name: true } })
    : [];
  const couponMap = new Map(coupons.map((c) => [c.id, c]));

  return NextResponse.json({
    kpis: {
      totalOrders,
      confirmedOrders,
      cancelledOrders,
      revenue: totalRevenue._sum.total || 0,
      totalDiscount: totalRevenue._sum.discount || 0,
      totalShipping: totalRevenue._sum.shipping || 0,
      avgOrderValue: avgOrder._avg.total || 0,
    },
    dailyData: (dailyData as any[]).map((d) => ({
      date: new Date(d.date).toISOString().split("T")[0],
      orders: d.orders,
      revenue: d.revenue,
      confirmedRevenue: d.confirmed_revenue,
    })),
    paymentMethods: paymentMethods.map((m) => ({
      method: m.paymentMethod,
      count: m._count,
      total: m._sum.total || 0,
    })),
    statusBreakdown: statusBreakdown.map((s) => ({ status: s.status, count: s._count })),
    couponUsage: couponUsage.map((c) => ({
      couponId: c.couponId,
      code: couponMap.get(c.couponId!)?.code || "?",
      name: couponMap.get(c.couponId!)?.name || "",
      usageCount: c._count,
      totalDiscount: c._sum.discount || 0,
    })),
  });
}
