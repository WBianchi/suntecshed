import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, AUTH_COOKIE_NAME } from "@/lib/auth";

function formatBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

export type NotificationType = "stock_change" | "price_change" | "stock_out";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  desc: string;
  timestamp: string;
  productId: string;
  imageUrl: string | null;
}

function getPrimaryImage(images: { url: string; isPrimary: boolean }[]): string | null {
  if (!images || images.length === 0) return null;
  const primary = images.find((img) => img.isPrimary);
  if (primary) return primary.url;
  return images[0].url;
}

function mapLogToNotification(log: {
  id: string;
  productId: string;
  productName: string;
  type: string;
  oldValue: number;
  newValue: number;
  createdAt: Date;
  product?: { images: { url: string; isPrimary: boolean }[] } | null;
}): AppNotification {
  const imageUrl = getPrimaryImage(log.product?.images ?? []);

  if (log.type === "PRICE_CHANGE") {
    const diff = log.newValue - log.oldValue;
    const pct = ((diff / log.oldValue) * 100);
    const pctStr =
      pct >= 0
        ? `${pct.toFixed(1)}% de aumento`
        : `${Math.abs(pct).toFixed(1)}% de desconto`;
    return {
      id: `productlog-${log.id}`,
      type: "price_change",
      title: "Reajuste de Preço",
      desc: `${log.productName}: de ${formatBRL(log.oldValue)} para ${formatBRL(log.newValue)} (${pctStr})`,
      timestamp: log.createdAt.toISOString(),
      productId: log.productId,
      imageUrl,
    };
  }
  if (log.type === "STOCK_OUT") {
    return {
      id: `productlog-${log.id}`,
      type: "stock_out",
      title: "Produto sem estoque",
      desc: `${log.productName}: o produto está sem estoque (era ${Math.round(log.oldValue)} unidades)`,
      timestamp: log.createdAt.toISOString(),
      productId: log.productId,
      imageUrl,
    };
  }
  return {
    id: `productlog-${log.id}`,
    type: "stock_change",
    title: "Alteração de Estoque",
    desc: `${log.productName}: de ${Math.round(log.oldValue)} para ${Math.round(log.newValue)} unidades`,
    timestamp: log.createdAt.toISOString(),
    productId: log.productId,
    imageUrl,
  };
}

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ notifications: [], unreadCount: 0, totalCount: 0 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ notifications: [], unreadCount: 0, totalCount: 0 });

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10) || 20));
    const q = (searchParams.get("q") || "").trim();

    const where: any = {};
    if (q) {
      where.productName = { contains: q, mode: "insensitive" };
    }

    const [logs, totalCount] = await Promise.all([
      prisma.productLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          product: {
            select: {
              images: {
                select: { url: true, isPrimary: true },
                orderBy: { order: "asc" },
              },
            },
          },
        },
      }),
      prisma.productLog.count({ where }),
    ]);

    const notifications: AppNotification[] = logs.map(mapLogToNotification);

    // unread: últimos 24h, independente de paginação — pegamos separado pra ser preciso
    const recentCount = q
      ? 0 // se tem filtro de busca, não calculamos unread (irrelevante no dropdown)
      : await prisma.productLog.count({
          where: {
            createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
        });

    return NextResponse.json({
      notifications,
      unreadCount: q ? 0 : recentCount,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    console.error("Notifications error:", error);
    return NextResponse.json({ error: "Erro ao buscar notificações" }, { status: 500 });
  }
}
