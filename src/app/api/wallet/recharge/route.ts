import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import {
  getAsaasConfig, findOrCreateCustomer, createCardPayment as createAsaasCardPayment, AsaasError,
} from "@/lib/asaas";
import { getPagarmeConfig, createCardPayment as createPagarmeCardPayment, PagarmeError } from "@/lib/pagarme";
import { calculateInstallment } from "@/lib/installments";
import { checkRateLimit, getClientIp, isSuspiciousUserAgent, checkCardBinVelocity, isWhitelistedEmail } from "@/lib/rate-limit";
import { verifyRecaptcha } from "@/lib/recaptcha";

// POST — Recarrega a carteira via cartão de crédito (Pagar.me/Asaas, credita na hora se aprovado)
//
// Esse endpoint não tinha NENHUMA proteção antes (11/08) e virou um segundo
// caminho pra testar cartões roubados, além do /api/orders. Reativado com
// as mesmas camadas do checkout: reCAPTCHA, user-agent, rate limit por
// IP/usuário e velocidade global (contador atômico).
export async function POST(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Token inválido" }, { status: 401 });

  try {
    const { method, amount, card, installments, recaptchaToken } = await req.json();

    // ═══════════════════════════════════════════════════════════
    // Busca o usuário para verificar whitelist antes de qualquer bloqueio
    // ═══════════════════════════════════════════════════════════
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, name: true, email: true, cashback: true, cpf: true, cnpj: true, phone: true, street: true, number: true, neighborhood: true, city: true, state: true, zipCode: true },
    });
    if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

    const isWhitelisted = isWhitelistedEmail(user.email);

    // ═══════════════════════════════════════════════════════════
    // CAMADA 0: reCAPTCHA v3 (pulada para e-mails whitelisted)
    // ═══════════════════════════════════════════════════════════
    if (!isWhitelisted) {
      const recaptchaOk = await verifyRecaptcha(recaptchaToken, "wallet_recharge");
      if (!recaptchaOk) {
        return NextResponse.json({ error: "Verificação de segurança falhou. Atualize a página e tente novamente." }, { status: 403 });
      }
    }

    // ═══════════════════════════════════════════════════════════
    // CAMADA 1: User-Agent + Rate limit por IP e por usuário
    // (pulada para e-mails whitelisted)
    // ═══════════════════════════════════════════════════════════
    const clientIp = getClientIp(req);
    const userAgent = req.headers.get("user-agent");

    if (!isWhitelisted) {
      if (isSuspiciousUserAgent(userAgent)) {
        return NextResponse.json({ error: "Acesso não permitido" }, { status: 403 });
      }

      const ipLimit = await checkRateLimit({ endpoint: "/api/wallet/recharge", key: `ip:${clientIp}`, maxRequests: 3, windowSeconds: 300 });
      if (!ipLimit.allowed) {
        return NextResponse.json(
          { error: "Muitas tentativas. Aguarde antes de tentar novamente.", retryAfterSeconds: ipLimit.retryAfterSeconds },
          { status: 429, headers: { "Retry-After": String(ipLimit.retryAfterSeconds) } }
        );
      }

      const userLimit = await checkRateLimit({ endpoint: "/api/wallet/recharge", key: `user:${payload.userId}`, maxRequests: 5, windowSeconds: 600 });
      if (!userLimit.allowed) {
        return NextResponse.json(
          { error: "Muitas tentativas. Aguarde antes de tentar novamente.", retryAfterSeconds: userLimit.retryAfterSeconds },
          { status: 429, headers: { "Retry-After": String(userLimit.retryAfterSeconds) } }
        );
      }
    }

    // ═══════════════════════════════════════════════════════════
    // CAMADA 2: Velocidade global de pagamentos com cartão (compartilhada
    // com o /api/orders — mesmo contador, mesmo ataque)
    // (pulada para e-mails whitelisted)
    // ═══════════════════════════════════════════════════════════
    if (!isWhitelisted) {
      const cardVelocity = await checkCardBinVelocity("", 12, 60);
      if (!cardVelocity.allowed) {
        return NextResponse.json(
          { error: "Muitos pagamentos sendo processados no momento. Tente novamente em instantes." },
          { status: 429, headers: { "Retry-After": String(cardVelocity.retryAfterSeconds) } }
        );
      }
    }

    // ═══════════════════════════════════════════════════════════
    // Processamento da recarga
    // ═══════════════════════════════════════════════════════════

    const value = Number(amount);
    const cardInstallments = Math.max(1, Number(installments) || 1);

    if (!value || value <= 0) {
      return NextResponse.json({ error: "Informe um valor válido" }, { status: 400 });
    }

    if (method !== "card") {
      return NextResponse.json({ error: "Método de pagamento inválido. Use cartão de crédito." }, { status: 400 });
    }

    const pagarmeConfig = getPagarmeConfig();
    const asaasConfig = pagarmeConfig ? null : await getAsaasConfig();

    if (!pagarmeConfig && !asaasConfig) {
      return NextResponse.json({ error: "Pagamento com cartão indisponível no momento." }, { status: 503 });
    }

    const rechargeCode = `RECARGA${Date.now().toString(36).toUpperCase()}`;
    const [expiryMonth, expiryYearShort] = String(card?.expiry || "").split("/");
    const expiryYear = expiryYearShort?.length === 2 ? `20${expiryYearShort}` : expiryYearShort || "";

    // O saldo creditado na carteira é sempre o valor nominal pedido — os
    // juros do parcelamento são só o que o cliente paga a mais no cartão
    // pra dividir, igual já funciona no checkout.
    const cardChargeTotal = calculateInstallment(value, cardInstallments).total;

    let status = "";
    let paymentId = "";

    if (pagarmeConfig) {
      const result = await createPagarmeCardPayment(pagarmeConfig, {
        value: cardChargeTotal,
        orderNumber: rechargeCode,
        installments: cardInstallments,
        creditCard: {
          holderName: card?.name || user.name,
          number: card?.number || "",
          expiryMonth: (expiryMonth || "").padStart(2, "0"),
          expiryYear,
          ccv: card?.cvv || "",
        },
        customer: {
          name: user.name,
          email: user.email,
          document: user.cnpj || user.cpf || "",
          phone: user.phone || undefined,
        },
        billingAddress: {
          street: user.street || "",
          number: user.number || "",
          neighborhood: user.neighborhood || "",
          city: user.city || "",
          state: user.state || "",
          zipCode: user.zipCode || "",
        },
      });
      status = result.status;
      paymentId = result.id;
    } else if (asaasConfig) {
      const customerId = await findOrCreateCustomer(asaasConfig, {
        name: user.name,
        email: user.email,
        cpfCnpj: user.cnpj || user.cpf || "",
        phone: user.phone || undefined,
      });
      const remoteIp =
        req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
        req.headers.get("x-real-ip") ||
        "127.0.0.1";
      const result = await createAsaasCardPayment(asaasConfig, {
        customerId,
        value: cardChargeTotal,
        orderNumber: rechargeCode,
        installments: cardInstallments,
        creditCard: {
          holderName: card?.name || user.name,
          number: card?.number || "",
          expiryMonth: (expiryMonth || "").padStart(2, "0"),
          expiryYear,
          ccv: card?.cvv || "",
        },
        holderInfo: {
          name: user.name,
          email: user.email,
          cpfCnpj: user.cpf || "",
          postalCode: user.zipCode || "",
          addressNumber: user.number || "",
          phone: user.phone || undefined,
          city: user.city || "",
          state: user.state || "",
        },
        remoteIp,
      });
      status = result.status;
      paymentId = result.id;
    }

    const approved = ["CONFIRMED", "RECEIVED"].includes(status);
    if (!approved) {
      return NextResponse.json({ error: "Pagamento não aprovado. Verifique os dados do cartão." }, { status: 400 });
    }

    const balanceAfter = user.cashback + value;
    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { cashback: balanceAfter } }),
      prisma.walletTransaction.create({
        data: {
          userId: user.id,
          type: "CREDIT",
          amount: value,
          balanceAfter,
          source: "RECHARGE_CARD",
          description: `Recarga via cartão (${paymentId})`,
        },
      }),
    ]);

    return NextResponse.json({ method: "card", balance: balanceAfter });
  } catch (err) {
    if (err instanceof AsaasError || err instanceof PagarmeError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("Wallet recharge error:", err);
    return NextResponse.json({ error: "Erro ao processar recarga" }, { status: 500 });
  }
}
