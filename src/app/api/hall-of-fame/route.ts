import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ── GET: Listar registros ativos para a página pública ──
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const sort = searchParams.get("sort") || "newest"; // newest, biggest
  const featured = searchParams.get("featured"); // se "1", retorna só destaques

  const where: any = { active: true };

  if (search) {
    where.OR = [
      { clientName: { contains: search, mode: "insensitive" } },
      { title: { contains: search, mode: "insensitive" } },
    ];
  }

  if (category) where.category = category;

  if (featured === "1") where.featured = true;

  let orderBy: any[] = [{ displayOrder: "asc" }];

  if (sort === "biggest") {
    orderBy = [{ salesValue: "desc" }, { displayOrder: "asc" }];
  } else {
    // newest first
    orderBy = [{ achievementDate: "desc" }, { displayOrder: "asc" }];
  }

  const entries = await prisma.hallOfFameEntry.findMany({
    where,
    orderBy,
  });

  return NextResponse.json(entries);
}
