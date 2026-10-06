import { NextRequest, NextResponse } from "next/server";
import { getAdminPayload, unauthorized } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  const { id } = await params;
  try {
    const body = await req.json();
    const { stock, lowStockAlert } = body;

    // Busca o produto atual para comparar valores
    const current = await prisma.product.findUnique({
      where: { id },
      select: { id: true, name: true, stock: true, lowStockAlert: true },
    });

    if (!current) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
    }

    const data: any = {};
    if (stock !== undefined) data.stock = parseInt(stock);
    if (lowStockAlert !== undefined) data.lowStockAlert = parseInt(lowStockAlert);

    const product = await prisma.product.update({
      where: { id },
      data,
      select: { id: true, name: true, stock: true, lowStockAlert: true },
    });

    // Registra log de alteração de estoque se o valor mudou
    if (stock !== undefined) {
      const newStock = parseInt(stock);
      if (newStock !== current.stock) {
        await prisma.productLog.create({
          data: {
            productId: id,
            productName: current.name,
            type: newStock === 0 ? "STOCK_OUT" : "STOCK_CHANGE",
            oldValue: current.stock,
            newValue: newStock,
          },
        });
      }
    }

    return NextResponse.json(product);
  } catch (error: any) {
    return NextResponse.json({ error: "Erro ao atualizar estoque" }, { status: 500 });
  }
}
