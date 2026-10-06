import { brandedEmailHtml, sendBrandedEmail } from "@/lib/email";

const ADMIN_EMAIL = "admin@suntecshed.com.br";

interface OrderStatusInfo {
  label: string;
  customerSubject: string;
  customerMessage: (ctx: OrderEmailContext) => string;
  adminSubject: string;
  adminMessage: (ctx: OrderEmailContext) => string;
}

export interface OrderEmailContext {
  orderNumber: string;
  customerName: string;
  total: number;
  trackingCode?: string | null;
}

function formatBRL(v: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

// Um template + mensagem por status — dispara pro cliente e pro admin
// sempre que o pedido muda pra esse status.
const STATUS_INFO: Record<string, OrderStatusInfo> = {
  PENDING: {
    label: "Pendente",
    customerSubject: "Recebemos seu pedido",
    customerMessage: (c) => `Recebemos seu pedido <strong>#${c.orderNumber}</strong> e estamos aguardando a confirmação do pagamento.`,
    adminSubject: "Novo pedido criado",
    adminMessage: (c) => `Novo pedido <strong>#${c.orderNumber}</strong> criado (${formatBRL(c.total)}), aguardando pagamento.`,
  },
  AWAITING_PAYMENT: {
    label: "Aguardando Pagamento",
    customerSubject: "Seu pedido está aguardando pagamento",
    customerMessage: (c) => `Seu pedido <strong>#${c.orderNumber}</strong> está aguardando a confirmação do pagamento. Assim que for aprovado, já começamos a preparar!`,
    adminSubject: "Pedido aguardando pagamento",
    adminMessage: (c) => `Pedido <strong>#${c.orderNumber}</strong> (${formatBRL(c.total)}) está aguardando pagamento.`,
  },
  PAYMENT_CONFIRMED: {
    label: "Pagamento Confirmado",
    customerSubject: "Pagamento confirmado!",
    customerMessage: (c) => `Seu pagamento do pedido <strong>#${c.orderNumber}</strong> foi confirmado. Já estamos preparando tudo pra envio!`,
    adminSubject: "Pagamento confirmado — separar pedido",
    adminMessage: (c) => `Pagamento do pedido <strong>#${c.orderNumber}</strong> (${formatBRL(c.total)}) foi confirmado — hora de separar pra envio.`,
  },
  PROCESSING: {
    label: "Em Preparo",
    customerSubject: "Seu pedido está sendo preparado",
    customerMessage: (c) => `Seu pedido <strong>#${c.orderNumber}</strong> está sendo preparado com carinho pra envio.`,
    adminSubject: "Pedido em preparação",
    adminMessage: (c) => `Pedido <strong>#${c.orderNumber}</strong> está em preparação.`,
  },
  SHIPPED: {
    label: "Enviado",
    customerSubject: "Seu pedido foi enviado!",
    customerMessage: (c) => `Seu pedido <strong>#${c.orderNumber}</strong> foi enviado!${c.trackingCode ? ` Código de rastreio: <strong>${c.trackingCode}</strong>` : ""}`,
    adminSubject: "Pedido enviado",
    adminMessage: (c) => `Pedido <strong>#${c.orderNumber}</strong> foi marcado como enviado.${c.trackingCode ? ` Rastreio: ${c.trackingCode}` : ""}`,
  },
  DELIVERED: {
    label: "Entregue",
    customerSubject: "Seu pedido foi entregue!",
    customerMessage: (c) => `Seu pedido <strong>#${c.orderNumber}</strong> foi entregue. Esperamos que você aproveite muito!`,
    adminSubject: "Pedido entregue",
    adminMessage: (c) => `Pedido <strong>#${c.orderNumber}</strong> foi entregue.`,
  },
  CANCELLED: {
    label: "Cancelado",
    customerSubject: "Seu pedido foi cancelado",
    customerMessage: (c) => `Seu pedido <strong>#${c.orderNumber}</strong> foi cancelado. Se tiver dúvidas, fale com a gente.`,
    adminSubject: "Pedido cancelado",
    adminMessage: (c) => `Pedido <strong>#${c.orderNumber}</strong> (${formatBRL(c.total)}) foi cancelado.`,
  },
  REFUNDED: {
    label: "Reembolsado",
    customerSubject: "Seu pedido foi reembolsado",
    customerMessage: (c) => `O valor do seu pedido <strong>#${c.orderNumber}</strong> (${formatBRL(c.total)}) foi reembolsado.`,
    adminSubject: "Pedido reembolsado",
    adminMessage: (c) => `Pedido <strong>#${c.orderNumber}</strong> (${formatBRL(c.total)}) foi reembolsado.`,
  },
  MISSING_LABEL: {
    label: "Ausência de Etiqueta",
    customerSubject: "Estamos providenciando o envio do seu pedido",
    customerMessage: (c) => `Estamos providenciando a etiqueta de envio do seu pedido <strong>#${c.orderNumber}</strong>. Assim que sair, avisamos.`,
    adminSubject: "Pedido aguardando etiqueta",
    adminMessage: (c) => `Pedido <strong>#${c.orderNumber}</strong> está aguardando etiqueta de envio.`,
  },
  ORDER_ERROR: {
    label: "Erro no Pedido",
    customerSubject: "Estamos verificando seu pedido",
    customerMessage: (c) => `Houve um problema com seu pedido <strong>#${c.orderNumber}</strong>. Nossa equipe já foi notificada e vai entrar em contato.`,
    adminSubject: "⚠️ Pedido com erro",
    adminMessage: (c) => `Pedido <strong>#${c.orderNumber}</strong> (${formatBRL(c.total)}) está com erro — verificar.`,
  },
};

export async function sendOrderStatusEmails(status: string, ctx: OrderEmailContext, customerEmail: string) {
  const info = STATUS_INFO[status];
  if (!info) return;

  try {
    const customerHtml = brandedEmailHtml({
      title: `Pedido #${ctx.orderNumber} — ${info.label}`,
      bodyHtml: `
        <p style="margin:0 0 16px;">Olá, ${ctx.customerName || "cliente"}!</p>
        <p style="margin:0 0 8px;">${info.customerMessage(ctx)}</p>
      `,
    });
    await sendBrandedEmail({ to: customerEmail, subject: info.customerSubject, html: customerHtml });
  } catch (err) {
    console.error(`Erro ao enviar e-mail de status (cliente) — pedido ${ctx.orderNumber}:`, err);
  }

  try {
    const adminHtml = brandedEmailHtml({
      title: `Pedido #${ctx.orderNumber} — ${info.label}`,
      bodyHtml: `<p style="margin:0;">${info.adminMessage(ctx)}</p>`,
    });
    await sendBrandedEmail({ to: ADMIN_EMAIL, subject: info.adminSubject, html: adminHtml });
  } catch (err) {
    console.error(`Erro ao enviar e-mail de status (admin) — pedido ${ctx.orderNumber}:`, err);
  }
}
