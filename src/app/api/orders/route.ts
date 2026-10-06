import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import {
  getAsaasConfig,
  findOrCreateCustomer,
  createCardPayment as createAsaasCardPayment,
  AsaasError,
  type AsaasPaymentResult,
} from "@/lib/asaas";
import { generateManualPix } from "@/lib/pix-manual";
import { getPagarmeConfig, createCardPayment as createPagarmeCardPayment, PagarmeError } from "@/lib/pagarme";
import { calculateInstallment } from "@/lib/installments";
import { sendOrderStatusEmails } from "@/lib/order-emails";
import { checkRateLimit, getClientIp, isSuspiciousUserAgent, checkOrdersVelocity, checkCardBinVelocity, isWhitelistedEmail } from "@/lib/rate-limit";
import { verifyRecaptcha } from "@/lib/recaptcha";

// Continua a numeração sequencial do site antigo (WooCommerce), em vez de
// gerar um código novo tipo "C7D-XXXXX" — o Caio já está acostumado a ver
// os pedidos como #338067, #338068 etc.
async function nextOrderNumber(): Promise<number> {
  const rows = await prisma.$queryRaw<{ max_num: bigint | null }[]>`
    SELECT MAX(CAST("orderNumber" AS BIGINT)) as max_num
    FROM orders
    WHERE "orderNumber" ~ '^[0-9]+$'
  `;
  const maxNum = rows[0]?.max_num ? Number(rows[0].max_num) : 338067;
  return maxNum + 1;
}

// GET — List orders for logged-in user
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Token inválido" }, { status: 401 });

    // page/limit são opcionais — quem não passar (ex: rastreio, que precisa
    // buscar em todos os pedidos) continua recebendo a lista completa.
    const url = new URL(req.url);
    const pageParam = url.searchParams.get("page");
    const limitParam = url.searchParams.get("limit");
    const search = url.searchParams.get("search")?.trim() || "";
    const paginated = !!pageParam || !!limitParam;
    const page = Math.max(1, parseInt(pageParam || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(limitParam || "10", 10)));

    const where: any = { userId: payload.userId };
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { trackingCode: { contains: search, mode: "insensitive" } },
        { items: { some: { name: { contains: search, mode: "insensitive" } } } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: { product: { select: { id: true, name: true, slug: true, images: { take: 1, orderBy: { order: "asc" } } } } },
          },
          address: true,
        },
        orderBy: { createdAt: "desc" },
        ...(paginated ? { skip: (page - 1) * limit, take: limit } : {}),
      }),
      paginated ? prisma.order.count({ where }) : Promise.resolve(0),
    ]);

    // Uso parcial do saldo da carteira junto com Pix/Cartão não fica salvo
    // no pedido em si — só na transação de débito criada no checkout.
    const walletTransactions = await prisma.walletTransaction.findMany({
      where: { orderId: { in: orders.map((o) => o.id) }, source: "ORDER_PAYMENT", type: "DEBIT" },
      select: { orderId: true, amount: true },
    });
    const walletByOrderId = new Map(walletTransactions.map((t) => [t.orderId, t.amount]));
    const ordersWithWallet = orders.map((o) => ({ ...o, walletAmountUsed: walletByOrderId.get(o.id) || 0 }));

    if (!paginated) return NextResponse.json({ orders: ordersWithWallet });
    return NextResponse.json({ orders: ordersWithWallet, total, page, totalPages: Math.max(1, Math.ceil(total / limit)) });
  } catch (error) {
    console.error("Orders list error:", error);
    return NextResponse.json({ error: "Erro ao buscar pedidos" }, { status: 500 });
  }
}

// Mapeamento reverso do label de tier (front-end) para o enum do banco
const TIER_LABEL_REVERSE: Record<string, string> = {
  "Dropshipping": "DROPSHIPPING",
  "Atacado": "ATACADO",
  "Grupo Vip": "GRUPO_VIP",
};

// POST — Create order from checkout
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, personal, address, payment, subtotal, shipping, shippingOption, discount, total, recaptchaToken } = body;

    // ═══════════════════════════════════════════════════════════
    // Autenticação (precisa rodar primeiro para sabermos se o
    // e-mail do usuário está na whitelist antes de qualquer bloqueio)
    // ═══════════════════════════════════════════════════════════

    const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Token inválido" }, { status: 401 });

    // Busca o usuário para verificar whitelist e bloqueios de conta suspeita
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { name: true, email: true },
    });

    // ═══════════════════════════════════════════════════════════
    // VERIFICAÇÃO DE WHITELIST: e-mails marcados como SEGUROS pulam
    // TODAS as camadas de segurança (reCAPTCHA, rate limit, bloqueio
    // de conta suspeita, velocidade global, etc.)
    // ═══════════════════════════════════════════════════════════
    const isWhitelisted = isWhitelistedEmail(user?.email);

    // ═══════════════════════════════════════════════════════════
    // CAMADA 0: reCAPTCHA v3 — roda invisível no navegador, analisa
    // comportamento/fingerprint. Bots conseguem trocar de IP/conta fácil,
    // mas replicar isso é bem mais difícil.
    // (pulada para e-mails whitelisted)
    // ═══════════════════════════════════════════════════════════
    if (!isWhitelisted) {
      const recaptchaOk = await verifyRecaptcha(recaptchaToken, "checkout");
      if (!recaptchaOk) {
        return NextResponse.json({ error: "Verificação de segurança falhou. Atualize a página e tente novamente." }, { status: 403 });
      }
    }

    // ═══════════════════════════════════════════════════════════
    // CAMADA 1: User-Agent + Rate limit por IP
    // (pulada para e-mails whitelisted)
    // ═══════════════════════════════════════════════════════════

    const clientIp = getClientIp(req);
    const userAgent = req.headers.get("user-agent");

    if (!isWhitelisted) {
      // Bloqueia user-agents suspeitos (redundante com o middleware, mas segurança extra)
      if (isSuspiciousUserAgent(userAgent)) {
        return NextResponse.json({ error: "Acesso não permitido" }, { status: 403 });
      }

      // Rate limit por IP: máx 2 tentativas a cada 5 minutos
      const ipLimit = await checkRateLimit({
        endpoint: "/api/orders",
        key: `ip:${clientIp}`,
        maxRequests: 2,
        windowSeconds: 300, // 5 minutos
      });

      if (!ipLimit.allowed) {
        return NextResponse.json(
          {
            error: "Muitas tentativas. Aguarde antes de tentar novamente.",
            retryAfterSeconds: ipLimit.retryAfterSeconds,
          },
          {
            status: 429,
            headers: { "Retry-After": String(ipLimit.retryAfterSeconds) },
          }
        );
      }
    }

    // ═══════════════════════════════════════════════════════════
    // CAMADA 2: Bloqueio de contas suspeitas (anti-bot)
    // (pulada para e-mails whitelisted)
    // ═══════════════════════════════════════════════════════════
    // O atacante está criando contas em massa com nome = e-mail e
    // e-mails que começam com "aurum". Bloqueamos ANTES de qualquer
    // tentativa de rate limit por usuário, parsing do body ou
    // gateway de pagamento — o pedido NEM COMEÇA.

    if (user && !isWhitelisted) {
      // Nome do usuário é um e-mail (contém @) — padrão de criação em massa por bot
      if (user.name && user.name.includes("@")) {
        return NextResponse.json(
          { error: "Conta inválida. Entre em contato com o suporte." },
          { status: 403 }
        );
      }

      // E-mail começa com "aurum" (case insensitive)
      if (user.email && user.email.toLowerCase().startsWith("aurum")) {
        return NextResponse.json(
          { error: "Conta inválida. Entre em contato com o suporte." },
          { status: 403 }
        );
      }
    }

    // ═══════════════════════════════════════════════════════════
    // CAMADA 3: Rate limit por usuário
    // (pulada para e-mails whitelisted)
    // ═══════════════════════════════════════════════════════════

    if (!isWhitelisted) {
      const userLimit = await checkRateLimit({
        endpoint: "/api/orders",
        key: `user:${payload.userId}`,
        maxRequests: 3,
        windowSeconds: 600, // 10 minutos
      });

      if (!userLimit.allowed) {
        return NextResponse.json(
          {
            error: "Muitas tentativas. Aguarde antes de tentar novamente.",
            retryAfterSeconds: userLimit.retryAfterSeconds,
          },
          {
            status: 429,
            headers: { "Retry-After": String(userLimit.retryAfterSeconds) },
          }
        );
      }
    }

    // ═══════════════════════════════════════════════════════════
    // Processamento do pedido
    // ═══════════════════════════════════════════════════════════

    if (!items?.length) {
      return NextResponse.json({ error: "Carrinho vazio" }, { status: 400 });
    }

    // ═══════════════════════════════════════════════════════════
    // CAMADA 4: Velocidade global — última linha de defesa contra bots
    // que driblam os limites por IP/usuário usando múltiplas contas/IPs
    // (pulada para e-mails whitelisted)
    // ═══════════════════════════════════════════════════════════

    if (!isWhitelisted) {
      const siteVelocity = await checkOrdersVelocity(10, 60); // máx 10 pedidos/min no site inteiro (reduzido de 20)
      if (!siteVelocity.allowed) {
        return NextResponse.json(
          { error: "Muitos pedidos sendo processados no momento. Tente novamente em instantes." },
          { status: 429, headers: { "Retry-After": String(siteVelocity.retryAfterSeconds) } }
        );
      }

      if (payment.method === "card") {
        const cardVelocity = await checkCardBinVelocity("", 12, 60); // máx 12 pedidos com cartão/min no site inteiro
        if (!cardVelocity.allowed) {
          return NextResponse.json(
            { error: "Muitos pagamentos com cartão sendo processados no momento. Tente novamente em instantes ou use Pix." },
            { status: 429, headers: { "Retry-After": String(cardVelocity.retryAfterSeconds) } }
          );
        }
      }
    }

    // Só guarda o ID do serviço quando a opção escolhida veio de uma
    // cotação real do Melhor Envio (id no formato "me-<service_id>") — é
    // isso que permite comprar a etiqueta depois direto do admin.
    const shippingMethodName: string | null = shippingOption?.name
      ? `${shippingOption.name}${shippingOption.company ? ` - ${shippingOption.company}` : ""}`
      : null;
    const meServiceId: string | null =
      typeof shippingOption?.id === "string" && shippingOption.id.startsWith("me-")
        ? shippingOption.id.slice(3)
        : null;

    // Pagamento com saldo da carteira: confere o saldo antes de criar o
    // pedido (evita criar e ter que apagar o pedido em seguida).
    if (payment.method === "wallet") {
      const walletUser = await prisma.user.findUnique({ where: { id: payload.userId }, select: { cashback: true } });
      if (!walletUser || walletUser.cashback < Number(total)) {
        return NextResponse.json({ error: "Saldo insuficiente na carteira" }, { status: 400 });
      }
    }

    const fullName = [personal?.name, personal?.lastName].filter(Boolean).join(" ") || "Cliente";

    // Map payment method
    const paymentMethodMap: Record<string, string> = {
      pix: "PIX",
      card: "CREDIT_CARD",
      wallet: "WALLET",
    };

    // Create or update user address
    let addressId: string | null = null;
    if (address?.cep) {
      const userAddress = await prisma.address.create({
        data: {
          userId: payload.userId,
          label: "Entrega",
          name: fullName,
          phone: personal?.phone || null,
          street: address.street,
          number: address.number,
          complement: address.complement || null,
          neighborhood: address.neighborhood,
          city: address.city,
          state: address.state,
          zipCode: address.cep.replace(/\D/g, ""),
          country: "Brasil",
          isDefault: false,
        },
      });
      addressId = userAddress.id;
    }

    // Update user info if needed. A CPF/CNPJ unique-constraint clash (e.g.
    // someone else's account already has that document on file) must not
    // block the purchase.
    if (personal?.phone || personal?.cpf || personal?.cnpj) {
      try {
        await prisma.user.update({
          where: { id: payload.userId },
          data: {
            ...(personal.phone && { phone: personal.phone }),
            ...(personal.cpf && { cpf: personal.cpf }),
            ...(personal.cnpj && { cnpj: personal.cnpj }),
          },
        });
      } catch (err) {
        const code = (err as { code?: string })?.code;
        if (code !== "P2002") throw err;
      }
    }

    // Only link productId when it actually exists — cart items can carry
    // ids from front-end mock data (e.g. "suggested products") that were
    // never real Product rows, and that must not break order creation.
    const itemIds = items
      .map((item: any) => item.id)
      .filter((id: unknown): id is string => typeof id === "string");

    // Busca TODOS os produtos (ativos e inativos) para poder rejeitar os inativos
    const allProducts = await prisma.product.findMany({
      where: { id: { in: itemIds } },
      select: { id: true, active: true, stock: true, manageStock: true, variants: true },
    });

    // Produtos que existem no banco mas estão inativos → bloqueia a compra
    const inactiveProductIds = allProducts.filter((p) => !p.active).map((p) => p.id);
    if (inactiveProductIds.length > 0) {
      const unavailableItems = items
        .filter((item: any) => inactiveProductIds.includes(item.id))
        .map((item: any) => item.name);
      return NextResponse.json(
        { error: `Os seguintes produtos não estão mais disponíveis: ${unavailableItems.join(", ")}` },
        { status: 400 }
      );
    }

    // Produtos ativos — podem ser linkados no pedido
    const activeProducts = allProducts.filter((p) => p.active);
    const existingProductIds = new Set(activeProducts.map((p) => p.id));
    const productMap = new Map(activeProducts.map((p) => [p.id, p]));

    // ============================================
    // Validação de estoque antes de criar o pedido
    // ============================================
    for (const item of items) {
      if (!item.id) continue;
      const product = productMap.get(item.id);
      if (!product || !product.manageStock) continue;

      // Encontra a variante correspondente ao tier e atributo real escolhidos
      const itemTier = item.tier ? TIER_LABEL_REVERSE[item.tier] ?? null : null;
      const variant = itemTier
        ? product.variants.find(
            (v) => v.tier === itemTier && (item.size || item.color ? v.value === (item.size || item.color) : true)
          )
        : undefined;

      // Estoque efetivo: variante com stock > 0 tem precedência, senão usa o base
      const effectiveStock = (variant && variant.stock > 0) ? variant.stock : product.stock;

      if (effectiveStock < item.quantity) {
        return NextResponse.json(
          { error: `Estoque insuficiente para "${item.name}". Disponível: ${effectiveStock}, solicitado: ${item.quantity}` },
          { status: 400 }
        );
      }
    }

    const cardNote = payment.method === "card" ? `Cartão ${payment.installments}x` : null;
    const notes = [cardNote, address?.observations || null].filter(Boolean).join(" — ") || null;

    // Create order with items — se dois checkouts caírem no mesmo número
    // sequencial ao mesmo tempo, a constraint única do orderNumber rejeita e
    // a gente tenta de novo com o próximo.
    const baseOrderNumber = await nextOrderNumber();
    let order!: Awaited<ReturnType<typeof prisma.order.create>>;
    let orderNumber = "";
    for (let attempt = 0; attempt < 5; attempt++) {
      orderNumber = String(baseOrderNumber + attempt);
      try {
        order = await prisma.order.create({
          data: {
            orderNumber,
            userId: payload.userId,
            addressId,
            status: "PENDING",
            paymentMethod: paymentMethodMap[payment.method] as any,
            paymentStatus: "PENDING",
            subtotal: subtotal || 0,
            shipping: shipping || 0,
            discount: discount || 0,
            total: total || 0,
            notes,
            recipientName: address?.recipientName || null,
            recipientDocument: address?.recipientDocument || null,
            labelUrl: personal?.labelUrl || null,
            shippingMethod: shippingMethodName,
            meServiceId,
            items: {
              create: items.map((item: any) => {
                const variantParts = [item.tier, item.color ? `${item.color}${item.size ? ` / ${item.size}` : ""}` : item.size]
                  .filter(Boolean);
                return {
                  productId: existingProductIds.has(item.id) ? item.id : null,
                  name: item.name,
                  price: item.price,
                  quantity: item.quantity,
                  variant: variantParts.length > 0 ? variantParts.join(" · ") : null,
                  image: item.image || null,
                };
              }),
            },
          },
          include: {
            items: true,
            address: true,
          },
        });
        break;
      } catch (err) {
        const code = (err as { code?: string })?.code;
        if (code === "P2002" && attempt < 4) continue;
        throw err;
      }
    }

    // ============================================
    // Payment: PIX manual (chave estática, sem gateway) / Carteira (débito
    // instantâneo do saldo) / Cartão via Asaas ou Pagar.me quando configurado
    // ============================================
    let paymentResult: (AsaasPaymentResult & { pixKey?: string; pixKeyLabel?: string }) | null = null;
    let paymentWarning: string | null = null;

    // Uso parcial do saldo da carteira junto com Pix/Cartão: debita o que
    // der (até o total) e gera o Pix/cobrança só do restante. Ex: pedido de
    // R$50 com R$10 de saldo → debita R$10, gera Pix de R$40.
    let walletAmountUsed = 0;
    let remainingTotal = Number(total);

    if (payment.useWalletBalance && (payment.method === "pix" || payment.method === "card")) {
      const walletUser = await prisma.user.findUnique({ where: { id: payload.userId }, select: { cashback: true } });
      if (walletUser && walletUser.cashback > 0) {
        walletAmountUsed = Math.min(walletUser.cashback, remainingTotal);
        if (walletAmountUsed > 0) {
          const balanceAfter = walletUser.cashback - walletAmountUsed;
          await prisma.$transaction([
            prisma.user.update({ where: { id: payload.userId }, data: { cashback: balanceAfter } }),
            prisma.walletTransaction.create({
              data: {
                userId: payload.userId,
                type: "DEBIT",
                amount: walletAmountUsed,
                balanceAfter,
                source: "ORDER_PAYMENT",
                description: `Pagamento parcial do pedido ${orderNumber}`,
                orderId: order.id,
              },
            }),
          ]);
          remainingTotal = Number((remainingTotal - walletAmountUsed).toFixed(2));
        }
      }
    }

    // O valor cobrado no cartão já inclui os juros do parcelamento (Tabela
    // Price) a partir de 2x — o mesmo cálculo exibido no checkout. Calculado
    // sobre o restante (depois de descontar o saldo usado, se houver).
    const cardInstallments = payment.installments || 1;
    const cardValue = calculateInstallment(remainingTotal, cardInstallments).total;

    // Endereço de cobrança efetivo: usa o endereço de entrega (address)
    // quando preenchido; caso contrário (etiqueta própria), usa o endereço
    // de cobrança preenchido no checkout.
    const billAddr = payment.billingAddress || {};
    const billingStreet = address?.street || billAddr.street || "";
    const billingNumber = address?.number || billAddr.number || "";
    const billingNeighborhood = address?.neighborhood || billAddr.neighborhood || "";
    const billingCity = address?.city || billAddr.city || "";
    const billingState = address?.state || billAddr.state || "";
    const billingCep = address?.cep || billAddr.cep || "";

    if (payment.method === "pix") {
      paymentResult = remainingTotal <= 0
        ? { id: `WALLET-${order.id}`, status: "CONFIRMED" }
        : await generateManualPix({ value: remainingTotal, orderNumber });
    } else if (payment.method === "wallet") {
      const walletUser = await prisma.user.findUnique({ where: { id: payload.userId }, select: { cashback: true } });
      if (!walletUser || walletUser.cashback < Number(total)) {
        await prisma.order.delete({ where: { id: order.id } }).catch(() => {});
        return NextResponse.json({ error: "Saldo insuficiente na carteira" }, { status: 400 });
      }
      const balanceAfter = walletUser.cashback - Number(total);
      await prisma.$transaction([
        prisma.user.update({ where: { id: payload.userId }, data: { cashback: balanceAfter } }),
        prisma.walletTransaction.create({
          data: {
            userId: payload.userId,
            type: "DEBIT",
            amount: Number(total),
            balanceAfter,
            source: "ORDER_PAYMENT",
            description: `Pagamento do pedido ${orderNumber}`,
            orderId: order.id,
          },
        }),
      ]);
      paymentResult = { id: `WALLET-${order.id}`, status: "CONFIRMED" };
    } else if (payment.method === "card" && remainingTotal <= 0) {
      // Saldo da carteira cobriu o pedido inteiro — nenhuma cobrança no cartão.
      paymentResult = { id: `WALLET-${order.id}`, status: "CONFIRMED" };
    } else {
      const asaasConfig = await getAsaasConfig();
      const pagarmeConfig = payment.method === "card" ? getPagarmeConfig() : null;

      if (!asaasConfig && !pagarmeConfig) {
        paymentWarning = "Gateway de pagamento não configurado. Você receberá as instruções de pagamento por e-mail.";
      } else {
        try {
          if (payment.method === "card" && pagarmeConfig) {
            paymentResult = await createPagarmeCardPayment(pagarmeConfig, {
              value: cardValue,
              orderNumber,
              installments: cardInstallments,
              creditCard: {
                holderName: payment.card?.name || fullName,
                number: payment.card?.number || "",
                expiryMonth: (String(payment.card?.expiry || "").split("/")[0] || "").padStart(2, "0"),
                expiryYear: (() => {
                  const [, y] = String(payment.card?.expiry || "").split("/");
                  return y?.length === 2 ? `20${y}` : y || "";
                })(),
                ccv: payment.card?.cvv || "",
              },
              customer: {
                name: fullName,
                email: personal?.email || "",
                document: (personal?.personType === "juridica" ? personal?.cnpj : personal?.cpf) || "",
                phone: personal?.phone,
              },
              billingAddress: {
                street: billingStreet,
                number: billingNumber,
                neighborhood: billingNeighborhood,
                city: billingCity,
                state: billingState,
                zipCode: billingCep,
              },
            });
          } else if (asaasConfig) {
            const customerId = await findOrCreateCustomer(asaasConfig, {
              name: fullName,
              email: personal?.email || "",
              cpfCnpj: (personal?.personType === "juridica" ? personal?.cnpj : personal?.cpf) || "",
              phone: personal?.phone,
              postalCode: billingCep,
              addressNumber: billingNumber,
            });

            if (payment.method === "card") {
              const [expiryMonth, expiryYearShort] = String(payment.card?.expiry || "").split("/");
              const remoteIp =
                req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
                req.headers.get("x-real-ip") ||
                "127.0.0.1";

              paymentResult = await createAsaasCardPayment(asaasConfig, {
                customerId,
                value: cardValue,
                orderNumber,
                installments: cardInstallments,
                creditCard: {
                  holderName: payment.card?.name || fullName,
                  number: payment.card?.number || "",
                  expiryMonth: (expiryMonth || "").padStart(2, "0"),
                  expiryYear: expiryYearShort?.length === 2 ? `20${expiryYearShort}` : expiryYearShort || "",
                  ccv: payment.card?.cvv || "",
                },
                holderInfo: {
                  name: personal?.name || "",
                  email: personal?.email || "",
                  cpfCnpj: personal?.cpf || "",
                  postalCode: billingCep,
                  addressNumber: billingNumber,
                  addressComplement: address?.complement,
                  phone: personal?.phone,
                  city: billingCity,
                  state: billingState,
                },
                remoteIp,
              });
            }
          }
        } catch (err) {
          // Card declined/refused: cancel the order so the customer can retry
          if (payment.method === "card") {
            // Estorna o saldo da carteira usado, já que o pedido não vai pra frente
            if (walletAmountUsed > 0) {
              const refundUser = await prisma.user.findUnique({ where: { id: payload.userId }, select: { cashback: true } });
              if (refundUser) {
                const restoredBalance = refundUser.cashback + walletAmountUsed;
                await prisma.$transaction([
                  prisma.user.update({ where: { id: payload.userId }, data: { cashback: restoredBalance } }),
                  prisma.walletTransaction.create({
                    data: {
                      userId: payload.userId,
                      type: "CREDIT",
                      amount: walletAmountUsed,
                      balanceAfter: restoredBalance,
                      source: "ORDER_PAYMENT",
                      description: `Estorno — cartão recusado no pedido ${orderNumber}`,
                      orderId: order.id,
                    },
                  }),
                ]);
              }
            }
            await prisma.order.delete({ where: { id: order.id } }).catch(() => {});
            const message =
              err instanceof AsaasError || err instanceof PagarmeError
                ? err.message
                : "Não foi possível processar o pagamento com cartão. Verifique os dados e tente novamente.";
            return NextResponse.json({ error: message }, { status: 400 });
          }
          console.error("Payment error:", err);
          paymentWarning = "Pedido criado, mas houve um problema ao gerar o pagamento. Entraremos em contato com as instruções.";
        }
      }
    }

    // Persist gateway payment id / status
    let finalStatus = "PENDING";
    if (paymentResult) {
      const instantConfirmed =
        payment.method === "wallet" || ["CONFIRMED", "RECEIVED"].includes(paymentResult.status);
      if (instantConfirmed) finalStatus = "PAYMENT_CONFIRMED";
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentId: paymentResult.id,
          ...(instantConfirmed && { paymentStatus: "CONFIRMED", status: "PAYMENT_CONFIRMED" }),
        },
      }).catch(() => {});
    }

    if (personal?.email) {
      sendOrderStatusEmails(finalStatus, { orderNumber, customerName: fullName, total }, personal.email);
    }

    // ============================================
    // Atualiza estoque do produto e da variante
    // ============================================
    for (const item of items) {
      if (!item.id) continue;
      const product = productMap.get(item.id);
      if (!product) continue;

      const itemTier = item.tier ? TIER_LABEL_REVERSE[item.tier] ?? null : null;
      const variant = itemTier
        ? product.variants.find(
            (v) => v.tier === itemTier && (item.size || item.color ? v.value === (item.size || item.color) : true)
          )
        : undefined;

      // Decrementa o estoque base do produto
      await prisma.product.update({
        where: { id: item.id },
        data: { stock: { decrement: item.quantity } },
      }).catch((err) => console.error("Failed to decrement product stock:", err));

      // Se a variante tem estoque próprio (>0), decrementa também
      if (variant && variant.stock > 0) {
        await prisma.productVariant.update({
          where: { id: variant.id },
          data: { stock: { decrement: item.quantity } },
        }).catch((err) => console.error("Failed to decrement variant stock:", err));
      }
    }

    return NextResponse.json(
      {
        order,
        orderNumber,
        payment: paymentResult
          ? {
              method: payment.method,
              status: paymentResult.status,
              pixQrCode: paymentResult.pixQrCode,
              pixCopyPaste: paymentResult.pixCopyPaste,
              pixExpiration: paymentResult.pixExpiration,
              pixKey: paymentResult.pixKey,
              pixKeyLabel: paymentResult.pixKeyLabel,
              invoiceUrl: paymentResult.invoiceUrl,
              dueDate: paymentResult.dueDate,
              walletAmountUsed: walletAmountUsed > 0 ? walletAmountUsed : undefined,
              remainingTotal: walletAmountUsed > 0 ? remainingTotal : undefined,
            }
          : null,
        paymentWarning,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Order create error:", error);
    return NextResponse.json({ error: "Erro ao criar pedido" }, { status: 500 });
  }
}
