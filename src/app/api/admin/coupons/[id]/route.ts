import { NextRequest, NextResponse } from "next/server";
import { getAdminPayload, unauthorized } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  const { id } = await params;
  const coupon = await prisma.coupon.findUnique({
    where: { id },
    include: {
      products: { include: { product: { select: { id: true, name: true, slug: true } } } },
      categories: { include: { category: { select: { id: true, name: true } } } },
      _count: { select: { orders: true } },
    },
  });

  if (!coupon) return NextResponse.json({ error: "Cupom não encontrado" }, { status: 404 });
  return NextResponse.json(coupon);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  const { id } = await params;
  try {
    const body = await req.json();
    const {
      code, name, description, type, appliesTo, value,
      minOrderValue, maxDiscount, usageLimit, usageLimitPerUser,
      startDate, endDate, active,
      productIds, categoryIds,
    } = body;

    // Sync products
    if (productIds !== undefined) {
      await prisma.couponProduct.deleteMany({ where: { couponId: id } });
      if (productIds.length > 0) {
        await prisma.couponProduct.createMany({
          data: productIds.map((pid: string) => ({ couponId: id, productId: pid })),
        });
      }
    }

    // Sync categories
    if (categoryIds !== undefined) {
      await prisma.couponCategory.deleteMany({ where: { couponId: id } });
      if (categoryIds.length > 0) {
        await prisma.couponCategory.createMany({
          data: categoryIds.map((cid: string) => ({ couponId: id, categoryId: cid })),
        });
      }
    }

    const coupon = await prisma.coupon.update({
      where: { id },
      data: {
        ...(code && { code: code.toUpperCase() }),
        ...(name && { name }),
        description: description ?? undefined,
        ...(type && { type }),
        ...(appliesTo && { appliesTo }),
        ...(value !== undefined && { value: parseFloat(value) }),
        minOrderValue: minOrderValue !== undefined ? (minOrderValue ? parseFloat(minOrderValue) : null) : undefined,
        maxDiscount: maxDiscount !== undefined ? (maxDiscount ? parseFloat(maxDiscount) : null) : undefined,
        usageLimit: usageLimit !== undefined ? (usageLimit ? parseInt(usageLimit) : null) : undefined,
        usageLimitPerUser: usageLimitPerUser !== undefined ? (usageLimitPerUser ? parseInt(usageLimitPerUser) : null) : undefined,
        startDate: startDate !== undefined ? (startDate ? new Date(startDate) : null) : undefined,
        endDate: endDate !== undefined ? (endDate ? new Date(endDate) : null) : undefined,
        ...(active !== undefined && { active }),
      },
      include: {
        products: { include: { product: { select: { id: true, name: true } } } },
        categories: { include: { category: { select: { id: true, name: true } } } },
        _count: { select: { orders: true } },
      },
    });

    return NextResponse.json(coupon);
  } catch (error: any) {
    console.error("Update coupon error:", error);
    return NextResponse.json({ error: error.message || "Erro ao atualizar cupom" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  const { id } = await params;
  try {
    await prisma.coupon.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Erro ao excluir cupom" }, { status: 500 });
  }
}
