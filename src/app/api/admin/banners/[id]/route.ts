import { NextRequest, NextResponse } from "next/server";
import { getAdminPayload, unauthorized } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  const { id } = await params;
  try {
    const body = await req.json();
    const banner = await prisma.banner.update({ where: { id }, data: body });
    return NextResponse.json(banner);
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar banner" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  const { id } = await params;
  try {
    await prisma.banner.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro ao excluir banner" }, { status: 500 });
  }
}
