import { NextRequest, NextResponse } from "next/server";
import { getAdminPayload, unauthorized } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

// PUT — Estender (soma dias à expiração atual) ou desativar o VIP
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  const { id } = await params;
  try {
    const { action, durationDays } = await req.json();

    if (action === "deactivate") {
      const user = await prisma.user.update({ where: { id }, data: { isVip: false } });
      return NextResponse.json(user);
    }

    if (action === "extend") {
      if (!durationDays) {
        return NextResponse.json({ error: "Duração é obrigatória" }, { status: 400 });
      }
      const current = await prisma.user.findUnique({ where: { id }, select: { vipExpiresAt: true } });
      const base = current?.vipExpiresAt && current.vipExpiresAt.getTime() > Date.now()
        ? current.vipExpiresAt
        : new Date();
      const expiresAt = new Date(base.getTime() + Number(durationDays) * 86400000);
      const user = await prisma.user.update({
        where: { id },
        data: { isVip: true, vipExpiresAt: expiresAt },
      });
      return NextResponse.json(user);
    }

    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  } catch (error: any) {
    console.error("Update VIP error:", error);
    return NextResponse.json({ error: "Erro ao atualizar VIP" }, { status: 500 });
  }
}
