import { NextRequest, NextResponse } from "next/server";
import { verifyToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST — Cliente anexa a própria etiqueta de envio a um pedido já feito,
// pra quando esquece de anexar no checkout (step 1). Só o dono do pedido
// pode anexar, e só se ainda não tiver etiqueta (nem a própria, nem uma já
// comprada pelo admin no Melhor Envio).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  const payload = token ? verifyToken(token) : null;
  if (!payload) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;

  try {
    const { labelUrl, labelName } = await req.json();
    if (!labelUrl) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { id }, select: { userId: true, labelUrl: true, notes: true } });
    if (!order || order.userId !== payload.userId) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
    }
    if (order.labelUrl) {
      return NextResponse.json({ error: "Este pedido já tem uma etiqueta anexada." }, { status: 400 });
    }

    const note = `Etiqueta anexada pelo cliente após o pedido${labelName ? `: ${labelName}` : ""}`;
    await prisma.order.update({
      where: { id },
      data: {
        labelUrl,
        notes: [order.notes, note].filter(Boolean).join(" — "),
      },
    });

    return NextResponse.json({ labelUrl });
  } catch (error) {
    console.error("Attach label error:", error);
    return NextResponse.json({ error: "Erro ao anexar etiqueta" }, { status: 500 });
  }
}
