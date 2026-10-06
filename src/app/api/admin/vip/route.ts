import { NextRequest, NextResponse } from "next/server";
import { getAdminPayload, unauthorized } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

// GET — Lista membros com histórico de VIP (ativos ou já desativados/expirados)
export async function GET(req: NextRequest) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  const url = new URL(req.url);
  const search = url.searchParams.get("search") || "";
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "10");

  const where: any = {
    OR: [{ isVip: true }, { vipExpiresAt: { not: null } }],
  };

  if (search) {
    where.AND = [
      {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      },
    ];
  }

  const [members, total, activeCount, expiringSoonCount] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true, name: true, email: true, isVip: true,
        vipActivatedAt: true, vipExpiresAt: true,
      },
      orderBy: { vipExpiresAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
    prisma.user.count({ where: { isVip: true, vipExpiresAt: { gt: new Date() } } }),
    prisma.user.count({
      where: {
        isVip: true,
        vipExpiresAt: { gt: new Date(), lte: new Date(Date.now() + 7 * 86400000) },
      },
    }),
  ]);

  return NextResponse.json({
    members,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    stats: { active: activeCount, expiringSoon: expiringSoonCount },
  });
}

// POST — Ativa o Grupo VIP pra um usuário (por duração em dias)
export async function POST(req: NextRequest) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  try {
    const { userId, durationDays } = await req.json();
    if (!userId || !durationDays) {
      return NextResponse.json({ error: "Usuário e duração são obrigatórios" }, { status: 400 });
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + Number(durationDays) * 86400000);

    const user = await prisma.user.update({
      where: { id: userId },
      data: { isVip: true, vipActivatedAt: now, vipExpiresAt: expiresAt },
    });

    return NextResponse.json(user);
  } catch (error: any) {
    console.error("Activate VIP error:", error);
    return NextResponse.json({ error: "Erro ao ativar VIP" }, { status: 500 });
  }
}
