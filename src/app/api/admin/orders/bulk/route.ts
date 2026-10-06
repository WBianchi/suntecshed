import { NextRequest, NextResponse } from "next/server";
import { getAdminPayload, unauthorized } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { sendOrderStatusEmails } from "@/lib/order-emails";

const VALID_STATUSES = [
  "PENDING", "AWAITING_PAYMENT", "PAYMENT_CONFIRMED", "PROCESSING",
  "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED", "MISSING_LABEL", "ORDER_ERROR",
];

// POST — Ação em massa nos pedidos selecionados: mudar status, mover pra
// lixeira, restaurar ou excluir definitivamente.
export async function POST(req: NextRequest) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  try {
    const { ids, action, status } = await req.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "Nenhum pedido selecionado" }, { status: 400 });
    }

    if (action === "status") {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json({ error: "Status inválido" }, { status: 400 });
      }
      const affectedOrders = await prisma.order.findMany({
        where: { id: { in: ids } },
        select: { orderNumber: true, total: true, trackingCode: true, user: { select: { name: true, email: true } } },
      });
      const result = await prisma.order.updateMany({
        where: { id: { in: ids } },
        data: { status },
      });
      for (const o of affectedOrders) {
        sendOrderStatusEmails(
          status,
          { orderNumber: o.orderNumber, customerName: o.user.name, total: o.total, trackingCode: o.trackingCode },
          o.user.email
        );
      }
      return NextResponse.json({ updated: result.count });
    }

    if (action === "trash") {
      const result = await prisma.order.updateMany({
        where: { id: { in: ids } },
        data: { deletedAt: new Date() },
      });
      return NextResponse.json({ updated: result.count });
    }

    if (action === "restore") {
      const result = await prisma.order.updateMany({
        where: { id: { in: ids } },
        data: { deletedAt: null },
      });
      return NextResponse.json({ updated: result.count });
    }

    if (action === "delete") {
      const result = await prisma.order.deleteMany({ where: { id: { in: ids } } });
      return NextResponse.json({ deleted: result.count });
    }

    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  } catch (error) {
    console.error("Bulk order action error:", error);
    return NextResponse.json({ error: "Erro ao processar ação em massa" }, { status: 500 });
  }
}
