import { NextRequest, NextResponse } from "next/server";
import { getAdminPayload, unauthorized } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { resolveReportPeriod } from "@/lib/report-period";

const PAGE_SIZE = 15;

export async function GET(req: NextRequest) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  const url = new URL(req.url);
  const period = url.searchParams.get("period") || "30d";
  const topSellingPage = Math.max(1, parseInt(url.searchParams.get("topSellingPage") || "1", 10));
  const lowStockPage = Math.max(1, parseInt(url.searchParams.get("lowStockPage") || "1", 10));
  const leastSellingPage = Math.max(1, parseInt(url.searchParams.get("leastSellingPage") || "1", 10));
  const { since, until } = resolveReportPeriod(period);

  const topSellingSkip = (topSellingPage - 1) * PAGE_SIZE;
  const lowStockSkip = (lowStockPage - 1) * PAGE_SIZE;
  const leastSellingSkip = (leastSellingPage - 1) * PAGE_SIZE;

  const [
    topSelling,
    topSellingTotal,
    topClicked,
    topViewed,
    lowStock,
    lowStockTotal,
    orderItemsAll,
    allActiveProducts,
  ] = await Promise.all([
    prisma.orderItem.groupBy({
      by: ["productId"],
      where: { order: { createdAt: { gte: since, lte: until }, paymentStatus: "CONFIRMED" } },
      _sum: { quantity: true, price: true },
      _count: true,
      orderBy: { _sum: { quantity: "desc" } },
      take: PAGE_SIZE,
      skip: topSellingSkip,
    }),
    prisma.orderItem.groupBy({
      by: ["productId"],
      where: { order: { createdAt: { gte: since, lte: until }, paymentStatus: "CONFIRMED" } },
    }).then((r) => r.length),
    prisma.productClick.groupBy({
      by: ["productId"],
      where: { createdAt: { gte: since, lte: until } },
      _count: true,
      orderBy: { _count: { productId: "desc" } },
      take: 15,
    }),
    prisma.pageView.groupBy({
      by: ["page"],
      where: { createdAt: { gte: since, lte: until }, page: { startsWith: "/produto/" } },
      _count: true,
      orderBy: { _count: { page: "desc" } },
      take: 15,
    }),
    prisma.product.findMany({
      where: { manageStock: true, stock: { lte: 5 }, active: true },
      select: { id: true, name: true, sku: true, stock: true, lowStockAlert: true, images: { take: 1, select: { url: true } } },
      orderBy: { stock: "asc" },
      take: PAGE_SIZE,
      skip: lowStockSkip,
    }),
    prisma.product.count({
      where: { manageStock: true, stock: { lte: 5 }, active: true },
    }),
    // Para "menos vendidos": todas as vendas do período
    prisma.orderItem.groupBy({
      by: ["productId"],
      where: { order: { createdAt: { gte: since, lte: until }, paymentStatus: "CONFIRMED" } },
      _sum: { quantity: true, price: true },
    }),
    // Todos os produtos ativos para o ranking de menos vendidos
    prisma.product.findMany({
      where: { active: true },
      select: { id: true, name: true, slug: true, price: true, images: { take: 1, select: { url: true } } },
    }),
  ]);

  // Monta ranking de menos vendidos (inclui quem vendeu zero)
  const soldMap = new Map<string, { qty: number; revenue: number }>();
  for (const oi of orderItemsAll) {
    if (oi.productId) {
      soldMap.set(oi.productId, { qty: oi._sum.quantity || 0, revenue: oi._sum.price || 0 });
    }
  }

  const allWithSales = allActiveProducts.map((p) => ({
    productId: p.id,
    name: p.name,
    image: p.images?.[0]?.url,
    slug: p.slug,
    price: p.price,
    quantity: soldMap.get(p.id)?.qty || 0,
    revenue: soldMap.get(p.id)?.revenue || 0,
  }));

  allWithSales.sort((a, b) => a.quantity - b.quantity);

  const leastSellingTotal = allWithSales.length;
  const leastSelling = allWithSales.slice(leastSellingSkip, leastSellingSkip + PAGE_SIZE);

  const allProductIds = [
    ...new Set([
      ...topSelling.map((p) => p.productId).filter((id): id is string => id !== null),
      ...topClicked.map((p) => p.productId),
    ]),
  ];

  const products = allProductIds.length > 0
    ? await prisma.product.findMany({
        where: { id: { in: allProductIds } },
        select: { id: true, name: true, slug: true, price: true, costPrice: true, images: { take: 1, select: { url: true } } },
      })
    : [];

  const productMap = new Map(products.map((p) => [p.id, p]));

  return NextResponse.json({
    topSelling: topSelling.map((p) => {
      const prod = p.productId ? productMap.get(p.productId) : undefined;
      const revenue = p._sum.price || 0;
      const qty = p._sum.quantity || 0;
      return {
        productId: p.productId,
        name: prod?.name || "Produto removido",
        image: prod?.images?.[0]?.url,
        slug: prod?.slug,
        quantity: qty,
        revenue,
        orders: p._count,
      };
    }),
    topSellingTotal,
    topSellingPage,
    topClicked: topClicked.map((p) => {
      const prod = p.productId ? productMap.get(p.productId) : undefined;
      return {
        productId: p.productId,
        name: prod?.name || "Produto removido",
        image: prod?.images?.[0]?.url,
        slug: prod?.slug,
        clicks: p._count,
        price: prod?.price || 0,
      };
    }),
    topViewed: topViewed.map((p) => {
      const slug = p.page.replace("/produto/", "");
      return { page: p.page, slug, views: p._count };
    }),
    lowStock,
    lowStockTotal,
    lowStockPage,
    leastSelling,
    leastSellingTotal,
    leastSellingPage,
  });
}
