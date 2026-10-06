import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import argon2 from "argon2";
import { signToken } from "@/lib/auth";
import { isLegacyHash, verifyLegacyPassword } from "@/lib/legacy-password";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email: rawEmail, password } = parsed.data;
    const email = rawEmail.toLowerCase().trim();

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(
        { error: "Email ou senha incorretos" },
        { status: 401 }
      );
    }

    // Contas migradas do WooCommerce antigo usam hash phpass ($P$/$H$) em vez de argon2.
    const validPassword = isLegacyHash(user.password)
      ? verifyLegacyPassword(password, user.password)
      : await argon2.verify(user.password, password);

    if (!validPassword) {
      return NextResponse.json(
        { error: "Email ou senha incorretos" },
        { status: 401 }
      );
    }

    // Upgrade silencioso do hash legado para argon2 no primeiro login pós-migração.
    if (isLegacyHash(user.password)) {
      const upgradedHash = await argon2.hash(password);
      await prisma.user.update({ where: { id: user.id }, data: { password: upgradedHash } });
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isVip: user.isVip,
      },
      token,
    });

    response.cookies.set("C7drop_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
