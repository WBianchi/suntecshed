import { NextRequest, NextResponse } from "next/server";
import { getAdminPayload, unauthorized } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { resolveReportPeriod } from "@/lib/report-period";

export async function GET(req: NextRequest) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  const url = new URL(req.url);
  const period = url.searchParams.get("period") || "30d";
  const { since, until, prevSince } = resolveReportPeriod(period);

  const [
    pageViews,
    prevPageViews,
    productClicks,
    prevProductClicks,
    orders,
    prevOrders,
    revenue,
    prevRevenue,
    uniqueVisitors,
    topPages,
    topProducts,
    dailyViews,
    dailyOrders,
    referrerStats,
  ] = await Promise.all([
    prisma.pageView.count({ where: { createdAt: { gte: since, lte: until } } }),
    prisma.pageView.count({ where: { createdAt: { gte: prevSince, lt: since } } }),
    prisma.productClick.count({ where: { createdAt: { gte: since, lte: until } } }),
    prisma.productClick.count({ where: { createdAt: { gte: prevSince, lt: since } } }),
    prisma.order.count({ where: { createdAt: { gte: since, lte: until } } }),
    prisma.order.count({ where: { createdAt: { gte: prevSince, lt: since } } }),
    prisma.order.aggregate({ where: { createdAt: { gte: since, lte: until }, paymentStatus: "CONFIRMED" }, _sum: { total: true } }),
    prisma.order.aggregate({ where: { createdAt: { gte: prevSince, lt: since }, paymentStatus: "CONFIRMED" }, _sum: { total: true } }),
    prisma.pageView.groupBy({ by: ["sessionId"], where: { createdAt: { gte: since, lte: until }, sessionId: { not: null } }, _count: true }),
    prisma.pageView.groupBy({
      by: ["page"],
      where: { createdAt: { gte: since, lte: until } },
      _count: true,
      orderBy: { _count: { page: "desc" } },
      take: 10,
    }),
    prisma.productClick.groupBy({
      by: ["productId"],
      where: { createdAt: { gte: since, lte: until } },
      _count: true,
      orderBy: { _count: { productId: "desc" } },
      take: 10,
    }),
    prisma.$queryRaw`
      SELECT DATE("createdAt") as date, COUNT(*)::int as views
      FROM page_views
      WHERE "createdAt" >= ${since} AND "createdAt" <= ${until}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    ` as Promise<{ date: Date; views: number }[]>,
    prisma.$queryRaw`
      SELECT DATE("createdAt") as date, COUNT(*)::int as orders, COALESCE(SUM(total), 0)::float as revenue
      FROM orders
      WHERE "createdAt" >= ${since} AND "createdAt" <= ${until}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    ` as Promise<{ date: Date; orders: number; revenue: number }[]>,
    prisma.pageView.groupBy({
      by: ["referrer"],
      where: { createdAt: { gte: since, lte: until }, referrer: { not: null } },
      _count: true,
      orderBy: { _count: { referrer: "desc" } },
      take: 10,
    }),
  ]);

  const revenueVal = revenue._sum.total || 0;
  const prevRevenueVal = prevRevenue._sum.total || 0;

  const productIds = topProducts.map((p) => p.productId).filter((id): id is string => id !== null);
  const productNames = productIds.length > 0
    ? await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true, slug: true, images: { take: 1, select: { url: true } } },
      })
    : [];

  const productMap = new Map(productNames.map((p) => [p.id, p]));

  const conversionRate = pageViews > 0 ? ((orders / pageViews) * 100) : 0;
  const avgOrderValue = orders > 0 ? revenueVal / orders : 0;

  return NextResponse.json({
    kpis: {
      pageViews,
      prevPageViews,
      productClicks,
      prevProductClicks,
      orders,
      prevOrders,
      revenue: revenueVal,
      prevRevenue: prevRevenueVal,
      uniqueVisitors: uniqueVisitors.length,
      conversionRate: Math.round(conversionRate * 100) / 100,
      avgOrderValue: Math.round(avgOrderValue * 100) / 100,
    },
    topPages: topPages.map((p) => ({ page: p.page, views: p._count })),
    topProducts: topProducts.map((p) => {
      const prod = p.productId ? productMap.get(p.productId) : undefined;
      return {
        productId: p.productId,
        name: prod?.name || "Produto removido",
        slug: prod?.slug,
        image: prod?.images?.[0]?.url,
        clicks: p._count,
      };
    }),
    dailyViews: (dailyViews as any[]).map((d) => ({
      date: new Date(d.date).toISOString().split("T")[0],
      views: d.views,
    })),
    dailyOrders: (dailyOrders as any[]).map((d) => ({
      date: new Date(d.date).toISOString().split("T")[0],
      orders: d.orders,
      revenue: d.revenue,
    })),
    referrers: referrerStats.map((r) => ({ referrer: r.referrer || "Direto", count: r._count })),
    period,
  });
}
