import { NextRequest, NextResponse } from "next/server";
import { getAdminPayload, unauthorized } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  const { id } = await params;
  try {
    const { name, subject, body, footer } = await req.json();
    const template = await prisma.emailTemplate.update({
      where: { id },
      data: { name, subject, body, footer: footer || null },
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
    const t = await prisma.emailTemplate.findUnique({ where: { id }, include: { _count: { select: { campaigns: true } } } });
    if (!t) return NextResponse.json({ error: "Template não encontrado" }, { status: 404 });
    if (t._count.campaigns > 0) {
      return NextResponse.json({ error: "Template em uso por campanhas. Remova as campanhas primeiro." }, { status: 400 });
    }
    await prisma.emailTemplate.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Erro ao excluir template" }, { status: 500 });
  }
}
