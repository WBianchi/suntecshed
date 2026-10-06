import { NextRequest, NextResponse } from "next/server";
import { getAdminPayload, unauthorized } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  const url = new URL(req.url);
  const search = url.searchParams.get("search") || "";
  const recovered = url.searchParams.get("recovered") || "";
  const sort = url.searchParams.get("sort") || "createdAt";
  const order = url.searchParams.get("order") || "desc";
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "20");

  const where: any = {};

  if (search) {
    where.OR = [
      { user: { name: { contains: search, mode: "insensitive" } } },
      { user: { email: { contains: search, mode: "insensitive" } } },
      { sessionId: { contains: search, mode: "insensitive" } },
    ];
  }

  if (recovered === "true") where.recovered = true;
  else if (recovered === "false") where.recovered = false;

  const [carts, total] = await Promise.all([
    prisma.abandonedCart.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        items: {
          include: { product: { select: { id: true, name: true, slug: true, images: { take: 1, select: { url: true } } } } },
        },
      },
      orderBy: { [sort]: order },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.abandonedCart.count({ where }),
  ]);

  return NextResponse.json({
    carts,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
