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
    newClients,
    prevNewClients,
    totalClients,
    clientsWithOrders,
    topBuyers,
    newClientsDaily,
    cityDistribution,
    stateDistribution,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "CLIENT", createdAt: { gte: since, lte: until } } }),
    prisma.user.count({ where: { role: "CLIENT", createdAt: { gte: prevSince, lt: since } } }),
    prisma.user.count({ where: { role: "CLIENT" } }),
    prisma.user.count({ where: { role: "CLIENT", orders: { some: { paymentStatus: "CONFIRMED" } } } }),
    prisma.user.findMany({
      where: { role: "CLIENT", orders: { some: { createdAt: { gte: since, lte: until } } } },
      select: {
        id: true, name: true, email: true, avatar: true, totalPurchases: true, createdAt: true,
        _count: { select: { orders: true } },
      },
      orderBy: { totalPurchases: "desc" },
      take: 15,
    }),
    prisma.$queryRaw`
      SELECT DATE("createdAt") as date, COUNT(*)::int as count
      FROM users WHERE role = 'CLIENT' AND "createdAt" >= ${since} AND "createdAt" <= ${until}
      GROUP BY DATE("createdAt") ORDER BY date ASC
    ` as Promise<{ date: Date; count: number }[]>,
    prisma.user.groupBy({
      by: ["city"],
      where: { role: "CLIENT", city: { not: null } },
      _count: true,
      orderBy: { _count: { city: "desc" } },
      take: 10,
    }),
    prisma.user.groupBy({
      by: ["state"],
      where: { role: "CLIENT", state: { not: null } },
      _count: true,
      orderBy: { _count: { state: "desc" } },
      take: 10,
    }),
  ]);

  const avgPurchases = clientsWithOrders > 0
    ? await prisma.order.aggregate({
        where: { paymentStatus: "CONFIRMED" },
        _avg: { total: true },
      })
    : { _avg: { total: 0 } };

  const totalRevenue = await prisma.user.aggregate({
    where: { role: "CLIENT" },
    _sum: { totalPurchases: true },
  });

  const ltv = totalClients > 0 ? (totalRevenue._sum.totalPurchases || 0) / totalClients : 0;

  return NextResponse.json({
    kpis: {
      newClients,
      prevNewClients,
      totalClients,
      clientsWithOrders,
      conversionRate: totalClients > 0 ? Math.round((clientsWithOrders / totalClients) * 10000) / 100 : 0,
      avgOrderValue: avgPurchases._avg.total || 0,
      ltv: Math.round(ltv * 100) / 100,
    },
    topBuyers: topBuyers.map((b) => ({
      id: b.id,
      name: b.name,
      email: b.email,
      avatar: b.avatar,
      totalPurchases: b.totalPurchases,
      orderCount: b._count.orders,
      since: b.createdAt,
    })),
    newClientsDaily: (newClientsDaily as any[]).map((d) => ({
      date: new Date(d.date).toISOString().split("T")[0],
      count: d.count,
    })),
    cityDistribution: cityDistribution.map((c) => ({ city: c.city, count: c._count })),
    stateDistribution: stateDistribution.map((s) => ({ state: s.state, count: s._count })),
  });
}
