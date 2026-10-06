import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendOrderStatusEmails } from "@/lib/order-emails";

// POST — Recebe notificações assíncronas do Pagar.me (ex: análise
// antifraude que resolve depois do checkout, estorno, chargeback).
// Configurar em Pagar.me > Configurações > Webhooks:
// https://c7drop.com.br/api/webhooks/pagarme
//
// Verificação opcional: se PAGARME_WEBHOOK_SECRET estiver setado no .env,
// a URL cadastrada no Pagar.me deve incluir ?secret=<mesmo valor>, ex:
// https://c7drop.com.br/api/webhooks/pagarme?secret=xxxxx
const PAID_STATUSES = new Set(["paid", "authorized_pending_capture"]);
const FAILED_STATUSES = new Set(["failed", "refused", "processing_failed"]);
const REFUNDED_STATUSES = new Set(["refunded", "chargedback", "charged_back"]);
const CANCELED_STATUSES = new Set(["canceled", "cancelled"]);

export async function POST(req: NextRequest) {
  const expectedSecret = process.env.PAGARME_WEBHOOK_SECRET;
  if (expectedSecret) {
    const provided = req.nextUrl.searchParams.get("secret");
    if (provided !== expectedSecret) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
  }

  try {
    const body = await req.json();
    const type = String(body?.type || "");
    const data = body?.data || {};

    // Eventos de charge trazem o pedido em order_id/order.id; eventos de
    // order já são o próprio pedido.
    const paymentId: string | undefined = data?.order?.id || data?.order_id || data?.id;
    const status: string = String(data?.status || "").toLowerCase();

    if (!paymentId || !status) {
      // Payload que não reconhecemos — responde 200 pra não gerar retry
      // infinito do lado do Pagar.me, só ignora.
      return NextResponse.json({ ok: true, ignored: true });
    }

    const order = await prisma.order.findFirst({
      where: { paymentId },
      include: { user: { select: { name: true, email: true } } },
    });
    if (!order) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    let paymentStatus: "PENDING" | "CONFIRMED" | "FAILED" | "REFUNDED" | "CANCELLED" | null = null;
    let orderStatus: "PAYMENT_CONFIRMED" | "ORDER_ERROR" | "REFUNDED" | "CANCELLED" | null = null;

    if (PAID_STATUSES.has(status)) {
      paymentStatus = "CONFIRMED";
      orderStatus = "PAYMENT_CONFIRMED";
    } else if (REFUNDED_STATUSES.has(status)) {
      paymentStatus = "REFUNDED";
      orderStatus = "REFUNDED";
    } else if (CANCELED_STATUSES.has(status)) {
      paymentStatus = "CANCELLED";
      orderStatus = "CANCELLED";
    } else if (FAILED_STATUSES.has(status)) {
      paymentStatus = "FAILED";
      orderStatus = "ORDER_ERROR";
    }

    if (paymentStatus && orderStatus) {
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus, status: orderStatus },
      });
      sendOrderStatusEmails(
        orderStatus,
        { orderNumber: order.orderNumber, customerName: order.user.name, total: order.total, trackingCode: order.trackingCode },
        order.user.email
      );
    }

    console.log(`[Pagar.me webhook] ${type} — pedido ${order.orderNumber}: ${status}`);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Pagar.me webhook error:", error);
    // Responde 200 mesmo em erro interno — evitar que o Pagar.me fique
    // reenviando o mesmo evento indefinidamente por um bug nosso.
    return NextResponse.json({ ok: false });
  }
}
