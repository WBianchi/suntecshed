import { NextRequest, NextResponse } from "next/server";
import { getAdminPayload, unauthorized } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  const url = new URL(req.url);
  const search = url.searchParams.get("search") || "";
  const stockFilter = url.searchParams.get("stockFilter") || "";
  const sort = url.searchParams.get("sort") || "stock";
  const order = url.searchParams.get("order") || "asc";
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "30");

  const where: any = { manageStock: true };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { sku: { contains: search, mode: "insensitive" } },
      { barcode: { contains: search, mode: "insensitive" } },
    ];
  }

  if (stockFilter === "out") where.stock = 0;
  else if (stockFilter === "low") where.stock = { gt: 0, lte: prisma.product.fields.lowStockAlert ? undefined : 10 };
  else if (stockFilter === "ok") where.stock = { gt: 10 };

  // For low stock, we need a raw approach since we compare stock <= lowStockAlert
  // Simplified: low = stock between 1 and 10
  if (stockFilter === "low") {
    where.stock = { gt: 0, lte: 10 };
  }

  const [products, total, stats] = await Promise.all([
    prisma.product.findMany({
      where,
      select: {
        id: true, name: true, sku: true, barcode: true, slug: true,
        stock: true, lowStockAlert: true, manageStock: true, price: true, active: true,
        images: { take: 1, select: { url: true } },
        categories: { select: { category: { select: { name: true } } }, take: 1 },
        variants: { select: { id: true, name: true, value: true, stock: true, sku: true } },
      },
      orderBy: { [sort]: order },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
    prisma.product.aggregate({
      where: { manageStock: true },
      _sum: { stock: true },
      _count: true,
    }),
  ]);

  const outOfStock = await prisma.product.count({ where: { manageStock: true, stock: 0 } });
  const lowStock = await prisma.product.count({ where: { manageStock: true, stock: { gt: 0, lte: 10 } } });

  return NextResponse.json({
    products,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    stats: {
      totalProducts: stats._count,
      totalUnits: stats._sum.stock || 0,
      outOfStock,
      lowStock,
    },
  });
}
