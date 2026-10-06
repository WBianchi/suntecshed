import { NextRequest, NextResponse } from "next/server";
import { getAdminPayload, unauthorized } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import argon2 from "argon2";

export async function POST(req: NextRequest) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  try {
    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Senha atual e nova senha são obrigatórias" }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Nova senha deve ter pelo menos 6 caracteres" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

    const valid = await argon2.verify(user.password, currentPassword);
    if (!valid) {
      return NextResponse.json({ error: "Senha atual incorreta" }, { status: 400 });
    }

    const hashedPassword = await argon2.hash(newPassword);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashedPassword } });

    return NextResponse.json({ ok: true, message: "Senha alterada com sucesso" });
  } catch (error: any) {
    console.error("Change password error:", error);
    return NextResponse.json({ error: "Erro ao alterar senha" }, { status: 500 });
  }
}
