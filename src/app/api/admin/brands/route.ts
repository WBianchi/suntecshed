import { NextRequest, NextResponse } from "next/server";
import { getAdminPayload, unauthorized } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  const brands = await prisma.brand.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { products: true } } },
  });
  return NextResponse.json(brands);
}

export async function POST(req: NextRequest) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  try {
    const body = await req.json();
    const brand = await prisma.brand.create({ data: body });
    return NextResponse.json(brand);
  } catch (error: any) {
    console.error("Brand create error:", error);
    return NextResponse.json({ error: "Erro ao criar marca" }, { status: 500 });
  }
}
