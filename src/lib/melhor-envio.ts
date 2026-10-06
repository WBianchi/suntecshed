import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";

// ============================================
// Compra de etiqueta direto no Melhor Envio — mesmo fluxo que o plugin do
// WooCommerce fazia (Melhor Envio > Meus pedidos > 🛒): adiciona ao
// carrinho, paga com o saldo da conta, gera e imprime a etiqueta.
// Documentação: https://docs.melhorenvio.com.br
// ============================================

export class MelhorEnvioError extends Error {}

interface MelhorEnvioSender {
  name: string;
  phone: string;
  email: string;
  document: string;
  postalCode: string;
  address: string;
  number: string;
  complement: string | null;
  district: string;
  city: string;
  stateAbbr: string;
}

interface MelhorEnvioConfig {
  token: string;
  sandbox: boolean;
  baseUrl: string;
  sender: MelhorEnvioSender;
  insurance: boolean;
  receipt: boolean;
  ownHand: boolean;
}

// Busca o perfil da conta Melhor Envio conectada — nome, documento e
// contato costumam vir corretos daqui. O ENDEREÇO desse endpoint é o
// endereço pessoal/cadastral da conta (KYC), que pode não ser o mesmo
// endereço de onde os produtos realmente saem — por isso o endereço vem
// de Integrações > Frete quando preenchido lá (ver getMelhorEnvioConfig).
async function fetchAccountProfile(token: string, baseUrl: string): Promise<MelhorEnvioSender | null> {
  try {
    const res = await fetch(`${baseUrl}/api/v2/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "User-Agent": "C7 Drop (contato@c7drop.com.br)",
      },
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.address) return null;

    return {
      name: data.name || `${data.firstname || ""} ${data.lastname || ""}`.trim() || "Remetente",
      phone: String(data.phone?.phone || "").replace(/\D/g, ""),
      email: data.email || "",
      document: String(data.document || "").replace(/\D/g, ""),
      postalCode: String(data.address.postal_code || "").replace(/\D/g, ""),
      address: data.address.address || "",
      number: data.address.number || "S/N",
      complement: data.address.complement || null,
      district: data.address.district || "",
      city: data.address.city?.city || "",
      stateAbbr: data.address.city?.state?.state_abbr || "",
    };
  } catch {
    return null;
  }
}

export async function getMelhorEnvioConfig(): Promise<MelhorEnvioConfig | null> {
  // .env é a fonte real — o painel admin é só um fallback cosmético.
  let token = process.env.MELHOR_ENVIO_TOKEN || "";
  let sandbox = (process.env.MELHOR_ENVIO_ENVIRONMENT || "sandbox") !== "production";

  const setting = await prisma.integrationSetting.findUnique({ where: { provider: "melhor_envio" } }).catch(() => null);
  const cfg = (setting?.config ?? {}) as Record<string, unknown>;

  if (!token) {
    token = String(cfg.access_token || "");
    sandbox = cfg.sandbox === true || cfg.sandbox === "true";
  }
  if (!token) return null;

  const baseUrl = sandbox ? "https://sandbox.melhorenvio.com.br" : "https://melhorenvio.com.br";
  const profile = await fetchAccountProfile(token, baseUrl);

  // Endereço de despacho: Integrações > Frete manda, porque a conta Melhor
  // Envio pode ter um endereço pessoal cadastrado diferente de onde os
  // produtos realmente saem. Só usa o endereço da conta se nada estiver
  // configurado manualmente.
  const hasManualAddress = !!String(cfg.sender_address || "").trim() && !!String(cfg.sender_city || "").trim() && !!String(cfg.sender_state || "").trim();

  let location: Pick<MelhorEnvioSender, "postalCode" | "address" | "number" | "complement" | "district" | "city" | "stateAbbr">;
  if (hasManualAddress) {
    const originCep = (process.env.MELHOR_ENVIO_ORIGIN_CEP || String(cfg.sender_zipcode || "")).replace(/\D/g, "");
    const [addrStreet, addrNumber] = String(cfg.sender_address || "").split(",").map((s) => s.trim());
    location = {
      postalCode: originCep,
      address: addrStreet || "",
      number: addrNumber || "S/N",
      complement: String(cfg.sender_complement || "").trim() || null,
      district: String(cfg.sender_district || "").trim(),
      city: String(cfg.sender_city || ""),
      stateAbbr: String(cfg.sender_state || ""),
    };
  } else if (profile) {
    location = profile;
  } else {
    location = { postalCode: "", address: "", number: "", complement: null, district: "", city: "", stateAbbr: "" };
  }

  const sender: MelhorEnvioSender = {
    name: String(cfg.sender_name || "").trim() || profile?.name || "C7 Drop",
    phone: (String(cfg.sender_phone || "").replace(/\D/g, "")) || profile?.phone || "",
    email: String(cfg.sender_email || "").trim() || profile?.email || "",
    document: (String(cfg.sender_document || "").replace(/\D/g, "")) || profile?.document || "",
    ...location,
  };

  return {
    token,
    sandbox,
    baseUrl,
    sender,
    insurance: cfg.insurance === true || cfg.insurance === "true",
    receipt: cfg.receipt === true || cfg.receipt === "true",
    ownHand: cfg.own_hand === true || cfg.own_hand === "true",
  };
}

// A API do Melhor Envio não é consistente no formato de erro entre
// endpoints: o carrinho às vezes manda {"error": "texto"} (singular), outras
// {"message": "texto"}, e o checkout/generate manda erros de validação
// Laravel-style ({"errors": {"campo": ["texto"]}}) ou uma lista de objetos
// ({"errors": [{"message": "texto"}]}). Sem cobrir os três formatos, a
// mensagem real do erro se perde e só sobra o fallback genérico.
function extractErrorsMessage(errors: unknown): string | null {
  if (Array.isArray(errors)) {
    const first = errors[0];
    if (typeof first === "string") return first;
    if (first && typeof first === "object" && "message" in first) return String((first as any).message);
    return JSON.stringify(errors);
  }
  if (errors && typeof errors === "object") {
    const first = Object.values(errors as Record<string, unknown>)[0];
    if (Array.isArray(first) && typeof first[0] === "string") return first[0];
    if (typeof first === "string") return first;
    return JSON.stringify(errors);
  }
  return null;
}

async function meFetch(config: MelhorEnvioConfig, path: string, body?: unknown) {
  const res = await fetch(`${config.baseUrl}${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "C7 Drop (contato@c7drop.com.br)",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      (typeof data?.message === "string" && data.message) ||
      (typeof data?.error === "string" && data.error) ||
      (data?.errors && extractErrorsMessage(data.errors)) ||
      `Erro ${res.status} na API do Melhor Envio`;
    throw new MelhorEnvioError(message);
  }
  return data;
}

export interface BuyLabelParams {
  serviceId: string;
  recipient: {
    name: string;
    document: string;
    phone?: string;
    email?: string;
    postalCode: string;
    address: string;
    number: string;
    complement?: string;
    district: string;
    city: string;
    stateAbbr: string;
  };
  volumes: { weight: number; width: number; height: number; length: number }[];
  products: { name: string; quantity: number; unitaryValue: number }[];
  insuranceValue: number;
}

export interface BuyLabelResult {
  cartId: string;
  trackingCode: string | null;
  labelUrl: string;
}

// O Melhor Envio tem campos separados pra pessoa física (document = CPF) e
// pessoa jurídica (company_document = CNPJ) — mandar um CNPJ de 14 dígitos
// em "document" é rejeitado com "O campo to.document deve ter um CPF
// válido", mesmo o documento sendo válido como CNPJ.
function splitDocument(raw: string | undefined | null): { document?: string; companyDocument?: string } {
  const digits = (raw || "").replace(/\D/g, "");
  if (!digits) return {};
  return digits.length > 11 ? { companyDocument: digits } : { document: digits };
}

// Busca o PDF final (etiqueta + declaração de conteúdo, quando houver) de um
// envio JÁ comprado/gerado no Melhor Envio e re-hospeda no nosso Blob.
// Separado de buyShippingLabel pra poder ser chamado de novo, sozinho, se
// esse passo falhar — sem precisar (e sem risco de) comprar o envio outra
// vez, já que o dinheiro já foi debitado antes desse ponto.
export async function fetchLabelPdf(cartId: string): Promise<{ labelUrl: string; trackingCode: string | null }> {
  const config = await getMelhorEnvioConfig();
  if (!config) throw new MelhorEnvioError("Melhor Envio não configurado.");

  const detail = await meFetch(config, `/api/v2/me/orders/${cartId}`);
  const trackingCode: string | null = detail?.tracking || null;

  // files["1"].pdf = a etiqueta em si (com o código de barras). files.dace
  // (fullPdf/pdf) = a declaração de conteúdo eletrônica, obrigatória em
  // envios interestaduais — um documento à parte, não a etiqueta com a
  // declaração já embutida. Ambas as URLs são assinadas da S3 e expiram em
  // ~30min, então baixamos as duas e juntamos num PDF só (etiqueta +
  // declaração, igual sai no "Imprimir romaneio" do painel deles) antes de
  // re-hospedar no nosso Blob pra ficar permanente.
  const labelPdfUrl: string | undefined = detail?.files?.["1"]?.pdf;
  const dacePdfUrl: string | undefined = detail?.files?.dace?.fullPdf || detail?.files?.dace?.pdf;

  const pdfBuffers: Buffer[] = [];
  for (const url of [labelPdfUrl, dacePdfUrl]) {
    if (!url) continue;
    const pdfRes = await fetch(url);
    if (pdfRes.ok) pdfBuffers.push(Buffer.from(await pdfRes.arrayBuffer()));
  }

  if (pdfBuffers.length === 0) {
    throw new MelhorEnvioError("O envio foi comprado, mas o PDF da etiqueta ainda não está disponível — tente novamente em instantes.");
  }

  let finalBuffer: Buffer;
  if (pdfBuffers.length === 1) {
    finalBuffer = pdfBuffers[0];
  } else {
    const { PDFDocument } = await import("pdf-lib");
    const merged = await PDFDocument.create();
    for (const buf of pdfBuffers) {
      const src = await PDFDocument.load(buf);
      const pages = await merged.copyPages(src, src.getPageIndices());
      pages.forEach((p) => merged.addPage(p));
    }
    finalBuffer = Buffer.from(await merged.save());
  }

  const blob = await put(`etiquetas/${cartId}.pdf`, finalBuffer, {
    access: "public",
    contentType: "application/pdf",
  });

  return { labelUrl: blob.url, trackingCode };
}

export async function buyShippingLabel(
  params: BuyLabelParams,
  opts?: { onPurchased?: (cartId: string) => Promise<void> }
): Promise<BuyLabelResult> {
  const config = await getMelhorEnvioConfig();
  if (!config) {
    throw new MelhorEnvioError("Melhor Envio não configurado — confira o token e o CEP de origem em Integrações > Frete.");
  }
  if (!config.sender.address || !config.sender.city || !config.sender.stateAbbr) {
    throw new MelhorEnvioError("Não foi possível obter um endereço de remetente completo — confira se a conta Melhor Envio conectada tem endereço cadastrado e confirmado.");
  }

  const senderDoc = splitDocument(config.sender.document);
  const recipientDoc = splitDocument(params.recipient.document);

  // 1. Adiciona o envio ao carrinho
  const cartItem = await meFetch(config, "/api/v2/me/cart", {
    service: Number(params.serviceId),
    from: {
      name: config.sender.name,
      phone: config.sender.phone || undefined,
      email: config.sender.email || undefined,
      document: senderDoc.document,
      company_document: senderDoc.companyDocument,
      address: config.sender.address,
      number: config.sender.number,
      complement: config.sender.complement || undefined,
      district: config.sender.district || undefined,
      city: config.sender.city,
      state_abbr: config.sender.stateAbbr,
      postal_code: config.sender.postalCode,
      country_id: "BR",
    },
    to: {
      name: params.recipient.name,
      phone: params.recipient.phone || undefined,
      email: params.recipient.email || undefined,
      document: recipientDoc.document,
      company_document: recipientDoc.companyDocument,
      address: params.recipient.address,
      number: params.recipient.number || "S/N",
      complement: params.recipient.complement || undefined,
      district: params.recipient.district || undefined,
      city: params.recipient.city,
      state_abbr: params.recipient.stateAbbr,
      postal_code: params.recipient.postalCode,
      country_id: "BR",
    },
    volumes: params.volumes,
    // Obrigatório pro Melhor Envio montar a declaração de conteúdo — sem
    // isso, o carrinho recusa com "é necessário informar ao menos um
    // produto quando selecionado declaração de conteúdo".
    products: params.products.map((p) => ({
      name: p.name,
      quantity: p.quantity,
      unitary_value: p.unitaryValue,
    })),
    options: {
      insurance_value: params.insuranceValue,
      receipt: config.receipt,
      own_hand: config.ownHand,
      non_commercial: false,
      platform: "C7 Drop",
    },
  });

  const cartId = cartItem?.id;
  if (!cartId) throw new MelhorEnvioError("Não foi possível adicionar o envio ao carrinho do Melhor Envio.");

  // 2. Paga com o saldo da conta conectada
  await meFetch(config, "/api/v2/me/shipment/checkout", { orders: [cartId] });

  // 3. Gera a etiqueta
  await meFetch(config, "/api/v2/me/shipment/generate", { orders: [cartId] });

  // A PARTIR DAQUI o saldo já foi debitado de verdade — persiste o cartId
  // imediatamente (antes de tentar buscar o PDF) pra uma eventual nova
  // tentativa nunca comprar de novo, só rebuscar o PDF deste mesmo envio.
  if (opts?.onPurchased) await opts.onPurchased(String(cartId));

  // 4. Marca como impressa (necessário pro fluxo do Melhor Envio, mas a URL
  // retornada aqui ("mode: private") é uma página do painel deles que exige
  // login — não um PDF de verdade. O PDF real vem via fetchLabelPdf.
  await meFetch(config, "/api/v2/me/shipment/print", { orders: [cartId], mode: "public" });

  const { labelUrl, trackingCode } = await fetchLabelPdf(String(cartId));
  return { cartId: String(cartId), trackingCode, labelUrl };
}
