import { NextRequest, NextResponse } from "next/server";
import { getAdminPayload, unauthorized } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  const url = new URL(req.url);
  const search = url.searchParams.get("search") || "";
  const status = url.searchParams.get("status") || "";
  const paymentStatus = url.searchParams.get("paymentStatus") || "";
  const dateFrom = url.searchParams.get("dateFrom") || "";
  const dateTo = url.searchParams.get("dateTo") || "";
  const hasLabel = url.searchParams.get("hasLabel") === "true";
  const trash = url.searchParams.get("trash") === "true";
  const sort = url.searchParams.get("sort") || "createdAt";
  const order = url.searchParams.get("order") || "desc";
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "20");

  // Por padrão esconde os pedidos na lixeira; ?trash=true mostra só eles.
  const where: any = trash ? { deletedAt: { not: null } } : { deletedAt: null };

  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: "insensitive" } },
      { user: { name: { contains: search, mode: "insensitive" } } },
      { user: { email: { contains: search, mode: "insensitive" } } },
    ];
  }

  if (status) where.status = status;
  if (paymentStatus) where.paymentStatus = paymentStatus;
  if (hasLabel) where.labelUrl = { not: null };

  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom);
    if (dateTo) where.createdAt.lte = new Date(dateTo + "T23:59:59.999Z");
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, avatar: true } },
        items: { include: { product: { select: { id: true, name: true, slug: true } } } },
        coupon: { select: { id: true, code: true, name: true } },
        address: true,
      },
      orderBy: { [sort]: order },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  // Uso parcial do saldo da carteira junto com Pix/Cartão não fica salvo no
  // pedido em si — só na transação de débito criada no checkout. Busca em
  // lote pra mostrar no admin quanto do total foi pago com saldo.
  const walletTransactions = await prisma.walletTransaction.findMany({
    where: { orderId: { in: orders.map((o) => o.id) }, source: "ORDER_PAYMENT", type: "DEBIT" },
    select: { orderId: true, amount: true },
  });
  const walletByOrderId = new Map(walletTransactions.map((t) => [t.orderId, t.amount]));
  const ordersWithWallet = orders.map((o) => ({ ...o, walletAmountUsed: walletByOrderId.get(o.id) || 0 }));

  return NextResponse.json({
    orders: ordersWithWallet,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
