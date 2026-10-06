import { NextRequest, NextResponse } from "next/server";
import { getAdminPayload, unauthorized } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  const { id } = await params;
  try {
    const { name, message, footer } = await req.json();
    const template = await prisma.whatsAppTemplate.update({
      where: { id },
      data: { name, message, footer: footer || null },
    });
    return NextResponse.json(template);
  } catch (error: any) {
    return NextResponse.json({ error: "Erro ao atualizar template" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  const { id } = await params;
  try {
    await prisma.whatsAppTemplate.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Erro ao excluir template" }, { status: 500 });
  }
}
