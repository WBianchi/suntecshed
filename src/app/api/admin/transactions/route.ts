import { NextRequest, NextResponse } from "next/server";
import { getAdminPayload, unauthorized } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  const url = new URL(req.url);
  const search = url.searchParams.get("search") || "";
  const paymentStatus = url.searchParams.get("paymentStatus") || "";
  const paymentMethod = url.searchParams.get("paymentMethod") || "";
  const dateFrom = url.searchParams.get("dateFrom") || "";
  const dateTo = url.searchParams.get("dateTo") || "";
  const sort = url.searchParams.get("sort") || "createdAt";
  const order = url.searchParams.get("order") || "desc";
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "20");

  const where: any = {
    paymentMethod: { not: null },
  };

  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: "insensitive" } },
      { paymentId: { contains: search, mode: "insensitive" } },
      { user: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  if (paymentStatus) where.paymentStatus = paymentStatus;
  if (paymentMethod) where.paymentMethod = paymentMethod;

  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo + "T23:59:59.999Z");
  }

  const [transactions, total, totals] = await Promise.all([
    prisma.order.findMany({
      where,
      select: {
        id: true, orderNumber: true, paymentMethod: true, paymentStatus: true,
        paymentId: true, total: true, subtotal: true, shipping: true, discount: true,
        status: true, createdAt: true,
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { [sort]: order },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
    prisma.order.aggregate({
      where: { ...where, paymentStatus: "CONFIRMED" },
      _sum: { total: true },
      _count: true,
    }),
  ]);

  return NextResponse.json({
    transactions,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    confirmedTotal: totals._sum.total || 0,
    confirmedCount: totals._count || 0,
  });
}
