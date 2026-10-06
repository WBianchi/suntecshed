import { NextRequest, NextResponse } from "next/server";
import { getAdminPayload, unauthorized } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  try {
    const { id } = await params;
    const body = await req.json();
    const brand = await prisma.brand.update({ where: { id }, data: body });
    return NextResponse.json(brand);
  } catch (error: any) {
    console.error("Brand update error:", error);
    return NextResponse.json({ error: "Erro ao atualizar marca" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  try {
    const { id } = await params;
    await prisma.brand.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Brand delete error:", error);
    return NextResponse.json({ error: "Erro ao excluir marca" }, { status: 500 });
  }
}
