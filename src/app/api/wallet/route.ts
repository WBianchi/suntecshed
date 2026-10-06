import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, AUTH_COOKIE_NAME } from "@/lib/auth";

// GET — Saldo e extrato da carteira do cliente logado
export async function GET(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Token inválido" }, { status: 401 });

  const [user, transactions] = await Promise.all([
    prisma.user.findUnique({ where: { id: payload.userId }, select: { cashback: true } }),
    prisma.walletTransaction.findMany({
      where: { userId: payload.userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

  return NextResponse.json({ balance: user.cashback, transactions });
}
