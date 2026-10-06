import { NextRequest, NextResponse } from "next/server";
import { getAdminPayload, unauthorized } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  const url = new URL(req.url);
  const search = url.searchParams.get("search") || "";
  const status = url.searchParams.get("status") || "";
  const type = url.searchParams.get("type") || "";
  const sort = url.searchParams.get("sort") || "createdAt";
  const order = url.searchParams.get("order") || "desc";
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "20");

  const where: any = {};

  if (search) {
    where.OR = [
      { code: { contains: search, mode: "insensitive" } },
      { name: { contains: search, mode: "insensitive" } },
    ];
  }

  if (status === "active") where.active = true;
  else if (status === "inactive") where.active = false;
  else if (status === "expired") where.endDate = { lt: new Date() };
  else if (status === "scheduled") where.startDate = { gt: new Date() };

  if (type) where.type = type;

  const [coupons, total] = await Promise.all([
    prisma.coupon.findMany({
      where,
      include: {
        products: { include: { product: { select: { id: true, name: true } } } },
        categories: { include: { category: { select: { id: true, name: true } } } },
        _count: { select: { orders: true } },
      },
      orderBy: { [sort]: order },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.coupon.count({ where }),
  ]);

  return NextResponse.json({
    coupons,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(req: NextRequest) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  try {
    const body = await req.json();
    const {
      code, name, description, type, appliesTo, value,
      minOrderValue, maxDiscount, usageLimit, usageLimitPerUser,
      startDate, endDate, active,
      productIds, categoryIds,
    } = body;

    if (!code || !name || value === undefined) {
      return NextResponse.json({ error: "Código, nome e valor são obrigatórios" }, { status: 400 });
    }

    const existing = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
    if (existing) {
      return NextResponse.json({ error: "Já existe um cupom com esse código" }, { status: 400 });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        name,
        description: description || null,
        type: type || "PERCENTAGE",
        appliesTo: appliesTo || "ORDER",
        value: parseFloat(value),
        minOrderValue: minOrderValue ? parseFloat(minOrderValue) : null,
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
        usageLimit: usageLimit ? parseInt(usageLimit) : null,
        usageLimitPerUser: usageLimitPerUser ? parseInt(usageLimitPerUser) : null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        active: active !== false,
        products: productIds?.length ? {
          create: productIds.map((pid: string) => ({ productId: pid })),
        } : undefined,
        categories: categoryIds?.length ? {
          create: categoryIds.map((cid: string) => ({ categoryId: cid })),
        } : undefined,
      },
      include: {
        products: { include: { product: { select: { id: true, name: true } } } },
        categories: { include: { category: { select: { id: true, name: true } } } },
        _count: { select: { orders: true } },
      },
    });

    return NextResponse.json(coupon, { status: 201 });
  } catch (error: any) {
    console.error("Create coupon error:", error);
    return NextResponse.json({ error: error.message || "Erro ao criar cupom" }, { status: 500 });
  }
}
