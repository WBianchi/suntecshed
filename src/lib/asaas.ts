import { prisma } from "@/lib/prisma";

// ============================================
// Asaas payment gateway client
// Config: ASAAS_API_KEY / ASAAS_ENVIRONMENT env vars (source of truth),
// fallback to admin > Integrações > Pagamentos (IntegrationSetting "asaas").
// ============================================

export interface AsaasConfig {
  apiKey: string;
  baseUrl: string;
  pixExpirationHours: number;
  boletoDaysDue: number;
  boletoInstructions?: string;
}

export class AsaasError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "AsaasError";
  }
}

export async function getAsaasConfig(): Promise<AsaasConfig | null> {
  const setting = await prisma.integrationSetting
    .findUnique({ where: { provider: "asaas" } })
    .catch(() => null);
  const cfg = (setting?.config ?? {}) as Record<string, unknown>;

  // .env is the real source of truth — the admin panel field is a cosmetic
  // placeholder for the client and should never override the real key.
  let apiKey = process.env.ASAAS_API_KEY || "";
  let sandbox = (process.env.ASAAS_ENVIRONMENT || "sandbox") !== "production";

  if (!apiKey) {
    const sandboxFlag = cfg.sandbox === true || cfg.sandbox === "true";
    apiKey = String((sandboxFlag ? cfg.sandbox_api_key || cfg.api_key : cfg.api_key) || "");
    sandbox = sandboxFlag;
  }

  if (!apiKey) return null;

  return {
    apiKey,
    baseUrl: sandbox ? "https://api-sandbox.asaas.com/v3" : "https://api.asaas.com/v3",
    pixExpirationHours: Number(cfg.pix_expiration_hours) || 24,
    boletoDaysDue: Number(cfg.boleto_days_due) || 3,
    boletoInstructions: cfg.boleto_instructions ? String(cfg.boleto_instructions) : undefined,
  };
}

async function asaasFetch<T = any>(
  config: AsaasConfig,
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`${config.baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      access_token: config.apiKey,
      "User-Agent": "C7drop",
      ...(init?.headers || {}),
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      data?.errors?.[0]?.description || `Erro na comunicação com o gateway de pagamento (${res.status})`;
    throw new AsaasError(message, res.status);
  }

  return data as T;
}

export interface AsaasCustomerInput {
  name: string;
  email: string;
  cpfCnpj: string;
  phone?: string;
  postalCode?: string;
  addressNumber?: string;
}

export async function findOrCreateCustomer(
  config: AsaasConfig,
  input: AsaasCustomerInput
): Promise<string> {
  const cpfCnpj = input.cpfCnpj.replace(/\D/g, "");

  const existing = await asaasFetch<{ data: Array<{ id: string }> }>(
    config,
    `/customers?cpfCnpj=${cpfCnpj}&limit=1`
  );
  if (existing.data?.length) return existing.data[0].id;

  const created = await asaasFetch<{ id: string }>(config, "/customers", {
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      email: input.email,
      cpfCnpj,
      mobilePhone: input.phone?.replace(/\D/g, "") || undefined,
      postalCode: input.postalCode?.replace(/\D/g, "") || undefined,
      addressNumber: input.addressNumber || undefined,
    }),
  });

  return created.id;
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export interface AsaasPaymentResult {
  id: string;
  status: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  dueDate?: string;
  pixQrCode?: string; // base64 image
  pixCopyPaste?: string;
  pixExpiration?: string;
  boletoDigitableLine?: string;
}

interface CreatePaymentBase {
  customerId: string;
  value: number;
  orderNumber: string;
}

export async function createPixPayment(
  config: AsaasConfig,
  { customerId, value, orderNumber }: CreatePaymentBase
): Promise<AsaasPaymentResult> {
  const dueDays = Math.max(1, Math.ceil(config.pixExpirationHours / 24));
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + dueDays);

  const payment = await asaasFetch<any>(config, "/payments", {
    method: "POST",
    body: JSON.stringify({
      customer: customerId,
      billingType: "PIX",
      value: Number(value.toFixed(2)),
      dueDate: formatDate(dueDate),
      description: `Pedido ${orderNumber} - C7 Drop`,
      externalReference: orderNumber,
    }),
  });

  const qr = await asaasFetch<{ encodedImage: string; payload: string; expirationDate: string }>(
    config,
    `/payments/${payment.id}/pixQrCode`
  );

  return {
    id: payment.id,
    status: payment.status,
    invoiceUrl: payment.invoiceUrl,
    dueDate: payment.dueDate,
    pixQrCode: qr.encodedImage,
    pixCopyPaste: qr.payload,
    pixExpiration: qr.expirationDate,
  };
}

export async function createBoletoPayment(
  config: AsaasConfig,
  { customerId, value, orderNumber }: CreatePaymentBase
): Promise<AsaasPaymentResult> {
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + config.boletoDaysDue);

  const payment = await asaasFetch<any>(config, "/payments", {
    method: "POST",
    body: JSON.stringify({
      customer: customerId,
      billingType: "BOLETO",
      value: Number(value.toFixed(2)),
      dueDate: formatDate(dueDate),
      description: `Pedido ${orderNumber} - C7 Drop`,
      externalReference: orderNumber,
    }),
  });

  let digitableLine: string | undefined;
  try {
    const field = await asaasFetch<{ identificationField: string }>(
      config,
      `/payments/${payment.id}/identificationField`
    );
    digitableLine = field.identificationField;
  } catch {
    // Boleto still accessible via bankSlipUrl
  }

  return {
    id: payment.id,
    status: payment.status,
    invoiceUrl: payment.invoiceUrl,
    bankSlipUrl: payment.bankSlipUrl,
    dueDate: payment.dueDate,
    boletoDigitableLine: digitableLine,
  };
}

export interface CreditCardInput {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
}

export interface CardHolderInfo {
  name: string;
  email: string;
  cpfCnpj: string;
  postalCode: string;
  addressNumber: string;
  addressComplement?: string;
  phone?: string;
  city: string;
  state: string;
}

export async function createCardPayment(
  config: AsaasConfig,
  {
    customerId,
    value,
    orderNumber,
    installments,
    creditCard,
    holderInfo,
    remoteIp,
  }: CreatePaymentBase & {
    installments: number;
    creditCard: CreditCardInput;
    holderInfo: CardHolderInfo;
    remoteIp: string;
  }
): Promise<AsaasPaymentResult> {
  const payment = await asaasFetch<any>(config, "/payments", {
    method: "POST",
    body: JSON.stringify({
      customer: customerId,
      billingType: "CREDIT_CARD",
      dueDate: formatDate(new Date()),
      description: `Pedido ${orderNumber} - C7 Drop`,
      externalReference: orderNumber,
      ...(installments > 1
        ? { installmentCount: installments, totalValue: Number(value.toFixed(2)) }
        : { value: Number(value.toFixed(2)) }),
      creditCard: {
        holderName: creditCard.holderName,
        number: creditCard.number.replace(/\D/g, ""),
        expiryMonth: creditCard.expiryMonth,
        expiryYear: creditCard.expiryYear,
        ccv: creditCard.ccv,
      },
      creditCardHolderInfo: {
        name: holderInfo.name,
        email: holderInfo.email,
        cpfCnpj: holderInfo.cpfCnpj.replace(/\D/g, ""),
        postalCode: holderInfo.postalCode.replace(/\D/g, ""),
        addressNumber: holderInfo.addressNumber,
        addressComplement: holderInfo.addressComplement || undefined,
        phone: holderInfo.phone?.replace(/\D/g, "") || undefined,
        city: holderInfo.city,
        state: holderInfo.state,
      },
      remoteIp,
    }),
  });

  return {
    id: payment.id,
    status: payment.status,
    invoiceUrl: payment.invoiceUrl,
    dueDate: payment.dueDate,
  };
}
