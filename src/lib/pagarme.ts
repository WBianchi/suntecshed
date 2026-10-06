// ============================================
// Pagar.me (API v5) — gateway de cartão de crédito
// Config: PAGARME_API_KEY (chave secreta, ex: sk_...) via .env
// Sem a chave configurada, getPagarmeConfig() retorna null e o
// checkout cai automaticamente pro Asaas (ver /api/orders/route.ts).
// ============================================

export interface PagarmeConfig {
  apiKey: string;
  baseUrl: string;
}

export class PagarmeError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "PagarmeError";
  }
}

export function getPagarmeConfig(): PagarmeConfig | null {
  const apiKey = process.env.PAGARME_API_KEY || "";
  if (!apiKey) return null;
  return { apiKey, baseUrl: "https://api.pagar.me/core/v5" };
}

// O Pagar.me manda um "message" genérico ("The request is invalid.") junto
// com um "errors" detalhado por campo — mas "errors" vem como OBJETO
// ({"campo": ["mensagem"]}), não array. Precisa checar o objeto ANTES do
// message genérico, senão o genérico sempre "ganha" (já que é truthy) e a
// causa real do erro nunca aparece pro usuário nem pro log.
function extractPagarmeErrorMessage(data: any, fallbackStatus: number): string {
  if (data?.errors && typeof data.errors === "object" && !Array.isArray(data.errors)) {
    const firstField = Object.values(data.errors)[0];
    if (Array.isArray(firstField) && typeof firstField[0] === "string") return firstField[0];
  }
  if (Array.isArray(data?.errors) && typeof data.errors[0]?.message === "string") {
    return data.errors[0].message;
  }
  if (typeof data?.message === "string") return data.message;
  return `Erro na comunicação com o gateway de pagamento (${fallbackStatus})`;
}

async function pagarmeFetch<T = any>(config: PagarmeConfig, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${config.baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${config.apiKey}:`).toString("base64")}`,
      ...(init?.headers || {}),
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new PagarmeError(extractPagarmeErrorMessage(data, res.status), res.status);
  }

  return data as T;
}

export interface PagarmePaymentResult {
  id: string;
  status: string; // mapeado pra CONFIRMED/RECEIVED quando pago, senão o status cru do Pagar.me
  invoiceUrl?: string;
}

export interface PagarmeCreditCardInput {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
}

export interface PagarmeCustomerInput {
  name: string;
  email: string;
  document: string; // CPF ou CNPJ, só dígitos
  phone?: string;
}

export interface PagarmeBillingAddressInput {
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
}

const PAGARME_PAID_STATUSES = new Set(["paid", "authorized_pending_capture"]);
const PAGARME_FAILED_STATUSES = new Set(["failed", "refused", "canceled", "processing_failed"]);

export async function createCardPayment(
  config: PagarmeConfig,
  {
    value,
    orderNumber,
    installments,
    creditCard,
    customer,
    billingAddress,
  }: {
    value: number;
    orderNumber: string;
    installments: number;
    creditCard: PagarmeCreditCardInput;
    customer: PagarmeCustomerInput;
    billingAddress: PagarmeBillingAddressInput;
  }
): Promise<PagarmePaymentResult> {
  const amountCents = Math.round(value * 100);
  const document = customer.document.replace(/\D/g, "");

  const order = await pagarmeFetch<any>(config, "/orders", {
    method: "POST",
    body: JSON.stringify({
      code: orderNumber,
      items: [
        {
          code: orderNumber,
          amount: amountCents,
          description: `Pedido ${orderNumber} - C7 Drop`,
          quantity: 1,
        },
      ],
      customer: {
        name: customer.name,
        email: customer.email,
        type: document.length > 11 ? "company" : "individual",
        document,
        document_type: document.length > 11 ? "CNPJ" : "CPF",
        phones: customer.phone
          ? {
              mobile_phone: {
                country_code: "55",
                area_code: customer.phone.replace(/\D/g, "").slice(0, 2),
                number: customer.phone.replace(/\D/g, "").slice(2),
              },
            }
          : undefined,
      },
      payments: [
        {
          payment_method: "credit_card",
          credit_card: {
            installments,
            statement_descriptor: "C7DROP",
            card: {
              number: creditCard.number.replace(/\D/g, ""),
              holder_name: creditCard.holderName,
              exp_month: creditCard.expiryMonth,
              exp_year: creditCard.expiryYear,
              cvv: creditCard.ccv,
              billing_address: {
                line_1: `${billingAddress.number}, ${billingAddress.street}, ${billingAddress.neighborhood}`,
                zip_code: billingAddress.zipCode.replace(/\D/g, ""),
                city: billingAddress.city,
                state: billingAddress.state,
                country: "BR",
              },
            },
          },
        },
      ],
    }),
  });

  const charge = order.charges?.[0];
  const rawStatus = charge?.status || order.status;

  // A cobrança pode falhar (cartão recusado, dado inválido, antifraude) mesmo
  // com a chamada HTTP retornando 200 — o Pagar.me só sinaliza isso no status
  // do charge, não no status HTTP. Sem essa checagem, o pedido era criado
  // como se tivesse dado certo, só marcado "pendente" pra sempre.
  if (PAGARME_FAILED_STATUSES.has(rawStatus)) {
    const lastTransaction = charge?.last_transaction;
    const gatewayMessage =
      lastTransaction?.acquirer_message || lastTransaction?.gateway_response?.errors?.[0]?.message;
    throw new PagarmeError(gatewayMessage || "Pagamento com cartão recusado. Verifique os dados e tente novamente.");
  }

  return {
    id: order.id,
    status: PAGARME_PAID_STATUSES.has(rawStatus) ? "CONFIRMED" : rawStatus,
  };
}
