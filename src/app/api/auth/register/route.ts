import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import argon2 from "argon2";
import { signToken } from "@/lib/auth";
import { z } from "zod";
import { checkRateLimit, getClientIp, isSuspiciousUserAgent } from "@/lib/rate-limit";
import { verifyRecaptcha } from "@/lib/recaptcha";

const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  phone: z.string().optional(),
  recaptchaToken: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.json();

    // ═══════════════════════════════════════════════════════════
    // CAMADA 0: reCAPTCHA v3 — mesma verificação do checkout
    // ═══════════════════════════════════════════════════════════
    const recaptchaOk = await verifyRecaptcha(rawBody?.recaptchaToken, "register");
    if (!recaptchaOk) {
      return NextResponse.json({ error: "Verificação de segurança falhou. Atualize a página e tente novamente." }, { status: 403 });
    }

    // ═══════════════════════════════════════════════════════════
    // CAMADA 1: Rate limit + User-Agent (anti criação em massa de contas)
    // ═══════════════════════════════════════════════════════════

    const clientIp = getClientIp(req);
    const userAgent = req.headers.get("user-agent");

    // Bloqueia user-agents suspeitos (redundante com o middleware, mas segurança extra)
    if (isSuspiciousUserAgent(userAgent)) {
      return NextResponse.json({ error: "Acesso não permitido" }, { status: 403 });
    }

    // Rate limit por IP: máx 5 registros a cada 30 minutos
    const ipLimit = await checkRateLimit({
      endpoint: "/api/auth/register",
      key: `ip:${clientIp}`,
      maxRequests: 5,
      windowSeconds: 1800, // 30 minutos
    });

    if (!ipLimit.allowed) {
      return NextResponse.json(
        {
          error: "Muitas tentativas de cadastro. Aguarde antes de tentar novamente.",
          retryAfterSeconds: ipLimit.retryAfterSeconds,
        },
        {
          status: 429,
          headers: { "Retry-After": String(ipLimit.retryAfterSeconds) },
        }
      );
    }

    // ═══════════════════════════════════════════════════════════
    // Processamento do registro
    // ═══════════════════════════════════════════════════════════

    const parsed = registerSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email: rawEmail, password, phone } = parsed.data;
    const email = rawEmail.toLowerCase().trim();

    // ═══════════════════════════════════════════════════════════
    // CAMADA 2: Bloqueio de contas suspeitas (anti-bot)
    // ═══════════════════════════════════════════════════════════
    // O atacante cria contas com nome = e-mail e e-mails que começam
    // com "aurum". Bloqueamos ANTES de criar o usuário no banco.

    // Nome é um e-mail (contém @) — padrão de criação em massa por bot
    if (name.includes("@")) {
      return NextResponse.json(
        { error: "Nome inválido. Use seu nome real, não um e-mail." },
        { status: 400 }
      );
    }

    // E-mail começa com "aurum" (case insensitive) — já normalizado para lowercase
    if (email.startsWith("aurum")) {
      return NextResponse.json(
        { error: "Não foi possível criar a conta. Entre em contato com o suporte." },
        { status: 403 }
      );
    }

    // ═══════════════════════════════════════════════════════════

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "Este email já está cadastrado" },
        { status: 409 }
      );
    }

    const hashedPassword = await argon2.hash(password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone: phone || null,
        role: "CLIENT",
      },
    });

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          avatar: user.avatar,
        },
        token,
      },
      { status: 201 }
    );

    response.cookies.set("C7drop_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
