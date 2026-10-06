import { NextRequest, NextResponse } from "next/server";
import { getAdminPayload, unauthorized } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

// GET — Lista clientes com saldo de carteira (busca por nome/email)
export async function GET(req: NextRequest) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  const url = new URL(req.url);
  const search = url.searchParams.get("search") || "";
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "10");

  const where: any = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};

  const [clients, total, aggregate] = await Promise.all([
    prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true, avatar: true, cashback: true },
      orderBy: { cashback: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
    prisma.user.aggregate({ _sum: { cashback: true }, where: { cashback: { gt: 0 } } }),
  ]);

  const withBalanceCount = await prisma.user.count({ where: { cashback: { gt: 0 } } });

  return NextResponse.json({
    clients,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    stats: {
      totalBalance: aggregate._sum.cashback || 0,
      withBalanceCount,
    },
  });
}

// POST — Credita ou debita saldo manualmente
export async function POST(req: NextRequest) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  try {
    const { userId, type, amount, description } = await req.json();

    if (!userId || !["CREDIT", "DEBIT"].includes(type) || !amount || Number(amount) <= 0) {
      return NextResponse.json({ error: "Usuário, tipo e valor (maior que zero) são obrigatórios" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { cashback: true } });
    if (!user) return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });

    const value = Number(amount);
    if (type === "DEBIT" && value > user.cashback) {
      return NextResponse.json({ error: "Saldo insuficiente para esse débito" }, { status: 400 });
    }

    const balanceAfter = type === "CREDIT" ? user.cashback + value : user.cashback - value;

    const [updatedUser, transaction] = await prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data: { cashback: balanceAfter } }),
      prisma.walletTransaction.create({
        data: {
          userId,
          type,
          amount: value,
          balanceAfter,
          source: "MANUAL",
          description: description || null,
          createdBy: payload.userId,
        },
      }),
    ]);

    return NextResponse.json({ user: updatedUser, transaction });
  } catch (error) {
    console.error("Wallet manual transaction error:", error);
    return NextResponse.json({ error: "Erro ao registrar transação" }, { status: 500 });
  }
}
