import { NextRequest, NextResponse } from "next/server";
import { getAdminPayload, unauthorized } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const CONFIRM_PHRASE = "EXCLUIR TODOS OS PEDIDOS";

// GET — Quantos pedidos existem hoje (pra mostrar antes de confirmar a exclusão)
export async function GET(req: NextRequest) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();
  const count = await prisma.order.count();
  return NextResponse.json({ count });
}

// POST — Exclui TODOS os pedidos do banco. Ação extremamente destrutiva e
// irreversível — só executa se a frase de confirmação bater exatamente.
export async function POST(req: NextRequest) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  try {
    const { confirm } = await req.json();
    if (confirm !== CONFIRM_PHRASE) {
      return NextResponse.json({ error: "Frase de confirmação incorreta" }, { status: 400 });
    }

    const result = await prisma.order.deleteMany({});
    return NextResponse.json({ deleted: result.count });
  } catch (error) {
    console.error("Delete all orders error:", error);
    return NextResponse.json({ error: "Erro ao excluir pedidos" }, { status: 500 });
  }
}
