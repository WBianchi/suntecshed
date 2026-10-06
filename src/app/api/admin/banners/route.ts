import { NextRequest, NextResponse } from "next/server";
import { getAdminPayload, unauthorized } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  const banners = await prisma.banner.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(banners);
}

export async function POST(req: NextRequest) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  try {
    const body = await req.json();
    const banner = await prisma.banner.create({ data: body });
    return NextResponse.json(banner);
  } catch (error: any) {
    console.error("Banner create error:", error);
    return NextResponse.json({ error: "Erro ao criar banner" }, { status: 500 });
  }
}
