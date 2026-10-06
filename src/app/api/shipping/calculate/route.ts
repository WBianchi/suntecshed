import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function getShippingRuleOptions(destCep: string) {
  const rules = await prisma.shippingRule.findMany({
    where: { active: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
  if (rules.length === 0) return [];

  let uf = "";
  let city = "";
  try {
    const res = await fetch(`https://viacep.com.br/ws/${destCep}/json/`);
    const data = await res.json();
    if (!data?.erro) {
      uf = String(data.uf || "").toUpperCase();
      city = String(data.localidade || "").toLowerCase();
    }
  } catch {
    // se o ViaCEP falhar, seguimos só com regras sem restrição geográfica
  }

  const cepNum = parseInt(destCep, 10);

  const matching = rules.filter((r) => {
    if (r.country && r.country.toLowerCase() !== "brasil") return false;
    if (r.state && r.state.toUpperCase() !== uf) return false;
    if (r.city && r.city.toLowerCase() !== city) return false;
    if (r.cepRangeStart && cepNum < parseInt(r.cepRangeStart, 10)) return false;
    if (r.cepRangeEnd && cepNum > parseInt(r.cepRangeEnd, 10)) return false;
    return true;
  });

  return matching.map((r) => ({
    id: r.id,
    name: r.name,
    price: r.price,
    days: r.estimatedDays ? `${r.estimatedDays} ${r.estimatedDays > 1 ? "dias úteis" : "dia útil"}` : "A combinar",
    company: "C7 Drop",
  }));
}

// Recomendação em frete.md: Correios PAC(1)/SEDEX(2), LATAM Cargo éFácil(12),
// Jadlog .Package Centralizado(27) e Total Express Standard(35) — melhor
// cobertura/custo-benefício testado. As demais (Jadlog .Com, Loggi, JeT,
// Azul, Mini Envios) ficam de fora por padrão.
const DEFAULT_SERVICES = "1,2,12,27,35";

async function getMelhorEnvioConfig() {
  // .env is the real source of truth — the admin panel field is a cosmetic
  // placeholder for the client and should never override the real token.
  let token = process.env.MELHOR_ENVIO_TOKEN || "";
  let sandbox = (process.env.MELHOR_ENVIO_ENVIRONMENT || "sandbox") !== "production";
  let originCep = (process.env.MELHOR_ENVIO_ORIGIN_CEP || "").replace(/\D/g, "");
  let services = DEFAULT_SERVICES;

  const setting = await prisma.integrationSetting
    .findUnique({ where: { provider: "melhor_envio" } })
    .catch(() => null);
  const cfg = (setting?.config ?? {}) as Record<string, unknown>;

  if (!token) {
    const sandboxFlag = cfg.sandbox === true || cfg.sandbox === "true";
    token = String(cfg.access_token || "");
    sandbox = sandboxFlag;
  }
  if (!originCep) {
    originCep = String(cfg.sender_zipcode || "").replace(/\D/g, "");
  }
  if (typeof cfg.carriers === "string" && cfg.carriers.trim()) {
    services = cfg.carriers.trim();
  }

  return { token, sandbox, originCep, services };
}

async function getMelhorEnvioOptions(destCep: string, items: { id?: string; quantity?: number }[]) {
  if (!Array.isArray(items) || items.length === 0) return [];

  const { token, sandbox, originCep, services } = await getMelhorEnvioConfig();
  if (!token || !originCep) return [];

  const productIds = items
    .map((i) => i?.id)
    .filter((id): id is string => typeof id === "string");

  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, price: true, weight: true, width: true, height: true, length: true },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  // Embalagem padrão pra produtos sem dimensão/peso próprios cadastrados.
  // Boa parte do catálogo migrado do WooCommerce tem peso cadastrado
  // implausivelmente baixo (< 10g) — provável erro de unidade na migração.
  // Aplicamos um piso mínimo (dimensões reais mínimas dos Correios/transportadoras
  // e 300g, mínimo exigido pelo Loggi Express) pra não mandar pacotes com
  // peso/dimensão perto de zero pra API.
  const payloadProducts = items
    .map((item) => {
      const p = item.id ? productMap.get(item.id) : undefined;
      if (!p) return null;
      return {
        id: p.id,
        width: Math.max(p.width || 15, 11),
        height: Math.max(p.height || 20, 2),
        length: Math.max(p.length || 16, 16),
        weight: Math.max((p.weight || 1000) / 1000, 0.3),
        insurance_value: p.price,
        quantity: item.quantity || 1,
      };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

  if (payloadProducts.length === 0) return [];

  const baseUrl = sandbox ? "https://sandbox.melhorenvio.com.br" : "https://melhorenvio.com.br";

  try {
    const meRes = await fetch(`${baseUrl}/api/v2/me/shipment/calculate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "C7 Drop (contato@c7drop.com.br)",
      },
      body: JSON.stringify({
        from: { postal_code: originCep },
        to: { postal_code: destCep },
        products: payloadProducts,
        services,
      }),
    });

    const data = await meRes.json().catch(() => null);
    if (!meRes.ok || !Array.isArray(data)) return [];

    return data
      .filter((quote: any) => !quote.error && quote.price != null)
      .map((quote: any) => ({
        id: `me-${quote.id}`,
        name: String(quote.name),
        price: Number(quote.price),
        days: quote.delivery_time
          ? `${quote.delivery_time} ${Number(quote.delivery_time) > 1 ? "dias úteis" : "dia útil"}`
          : "Prazo a combinar",
        company: quote.company?.name || "Transportadora",
      }));
  } catch {
    return [];
  }
}

export async function POST(request: NextRequest) {
  try {
    const { cep, items } = await request.json();
    const destCep = String(cep || "").replace(/\D/g, "");

    if (destCep.length !== 8) {
      return NextResponse.json({ error: "CEP inválido." }, { status: 400 });
    }

    // As opções aparecem juntas: regras próprias (Admin > Frete) + cotação
    // real de transportadora via Melhor Envio (quando configurado).
    const [ruleOptions, melhorEnvioOptions] = await Promise.all([
      getShippingRuleOptions(destCep),
      getMelhorEnvioOptions(destCep, Array.isArray(items) ? items : []),
    ]);

    return NextResponse.json({ options: [...ruleOptions, ...melhorEnvioOptions] });
  } catch {
    return NextResponse.json({ error: "Erro ao calcular o frete." }, { status: 500 });
  }
}
