import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyResetToken } from "@/lib/auth";
import argon2 from "argon2";
import { z } from "zod";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { token, password } = parsed.data;
    const decoded = verifyResetToken(token);
    if (!decoded) {
      return NextResponse.json({ error: "Link inválido ou expirado. Solicite uma nova redefinição." }, { status: 400 });
    }

    const hashed = await argon2.hash(password);
    await prisma.user.update({ where: { id: decoded.userId }, data: { password: hashed } });

    return NextResponse.json({ message: "Senha redefinida com sucesso" });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Erro ao redefinir senha" }, { status: 500 });
  }
}
