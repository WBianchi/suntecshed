import { NextRequest, NextResponse } from "next/server";
import { getAdminPayload, unauthorized } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const CLEANUP_SECRET = "c7drop-cleanup-8f3a2b1c-2026";

function isAuthorized(req: NextRequest): boolean {
  // Aceita header secreto (para chamadas automatizadas) ou cookie de admin
  if (req.headers.get("x-cleanup-secret") === CLEANUP_SECRET) return true;
  return false;
}

// GET: apenas lista os usuários suspeitos (não deleta)
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    const payload = await getAdminPayload(req);
    if (!payload) return unauthorized();
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        role: "CLIENT",
        OR: [
          { name: { contains: "@" } },
          { email: { startsWith: "aurum", mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, email: true, _count: { select: { orders: true } } },
    });

    return NextResponse.json({
      count: users.length,
      users,
    });
  } catch (error: any) {
    console.error("Cleanup bots list error:", error);
    return NextResponse.json(
      { error: "Erro ao listar usuários suspeitos", details: error?.message },
      { status: 500 },
    );
  }
}

// POST: deleta os usuários suspeitos e seus pedidos
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    const payload = await getAdminPayload(req);
    if (!payload) return unauthorized();
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        role: "CLIENT",
        OR: [
          { name: { contains: "@" } },
          { email: { startsWith: "aurum", mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, email: true },
    });

    if (users.length === 0) {
      return NextResponse.json({ message: "Nenhum usuário suspeito encontrado.", deleted: 0 });
    }

    const userIds = users.map((u) => u.id);

    await prisma.$transaction([
      prisma.order.deleteMany({ where: { userId: { in: userIds } } }),
      prisma.user.deleteMany({ where: { id: { in: userIds } } }),
    ]);

    console.log(`🧹 Cleanup de bots: ${users.length} usuários removidos`, users.map(u => u.email));

    return NextResponse.json({
      message: `${users.length} usuários suspeitos removidos com sucesso.`,
      deleted: users.length,
      users,
    });
  } catch (error: any) {
    console.error("Cleanup bots error:", error);
    return NextResponse.json(
      { error: "Erro ao remover usuários suspeitos", details: error?.message },
      { status: 500 },
    );
  }
}
