import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signResetToken } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/email";
import { z } from "zod";

const schema = z.object({ email: z.string().email() });

// POST — sempre responde com sucesso genérico, exista ou não o e-mail
// cadastrado (evita revelar quais e-mails têm conta no sistema).
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "E-mail inválido" }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      const token = signResetToken(user.id);
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://c7drop.com.br";
      const resetUrl = `${baseUrl}/redefinir-senha?token=${token}`;
      try {
        await sendPasswordResetEmail(user.email, user.name, resetUrl);
      } catch (err) {
        console.error("Erro ao enviar e-mail de redefinição:", err);
      }
    }

    return NextResponse.json({
      message: "Se este e-mail estiver cadastrado, você receberá um link para redefinir sua senha.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Erro ao processar solicitação" }, { status: 500 });
  }
}
