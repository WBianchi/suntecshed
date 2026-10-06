import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const banners = await prisma.banner.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
    });
    return NextResponse.json(banners);
  } catch (error: any) {
    console.error("Banners fetch error:", error);
    return NextResponse.json({ error: "Erro ao buscar banners" }, { status: 500 });
  }
}
