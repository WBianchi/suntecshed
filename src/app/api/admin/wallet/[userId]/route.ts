import { NextRequest, NextResponse } from "next/server";
import { getAdminPayload, unauthorized } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

// GET — Saldo atual + extrato de um cliente
export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  const { userId } = await params;

  const [user, transactions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, avatar: true, cashback: true },
    }),
    prisma.walletTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  if (!user) return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });

  return NextResponse.json({ user, transactions });
}
