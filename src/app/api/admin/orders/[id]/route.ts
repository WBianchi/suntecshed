import { NextRequest, NextResponse } from "next/server";
import { getAdminPayload, unauthorized } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { sendOrderStatusEmails } from "@/lib/order-emails";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, avatar: true, cpf: true, createdAt: true, totalPurchases: true } },
      items: { include: { product: { select: { id: true, name: true, slug: true, images: { take: 1, select: { url: true } } } } } },
      coupon: true,
      address: true,
    },
  });

  if (!order) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });

  // Uso parcial do saldo da carteira junto com Pix/Cartão não fica salvo no
  // pedido em si — só na transação de débito criada no checkout. Busca aqui
  // pra mostrar no admin quanto do total foi pago com saldo.
  const walletTransaction = await prisma.walletTransaction.findFirst({
    where: { orderId: id, source: "ORDER_PAYMENT", type: "DEBIT" },
    select: { amount: true },
  });

  return NextResponse.json({ ...order, walletAmountUsed: walletTransaction?.amount || 0 });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  const { id } = await params;
  try {
    const body = await req.json();
    const { status, paymentStatus, trackingCode, shippingMethod, notes } = body;

    const data: any = {};
    if (status) data.status = status;
    if (paymentStatus) data.paymentStatus = paymentStatus;
    if (trackingCode !== undefined) data.trackingCode = trackingCode;
    if (shippingMethod !== undefined) data.shippingMethod = shippingMethod;
    if (notes !== undefined) data.notes = notes;

    const order = await prisma.order.update({
      where: { id },
      data,
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: { include: { product: { select: { id: true, name: true, slug: true } } } },
        coupon: { select: { id: true, code: true } },
        address: true,
      },
    });

    if (status) {
      sendOrderStatusEmails(
        status,
        { orderNumber: order.orderNumber, customerName: order.user.name, total: order.total, trackingCode: order.trackingCode },
        order.user.email
      );
    }

    return NextResponse.json(order);
  } catch (error: any) {
    console.error("Update order error:", error);
    return NextResponse.json({ error: error.message || "Erro ao atualizar pedido" }, { status: 500 });
  }
}
