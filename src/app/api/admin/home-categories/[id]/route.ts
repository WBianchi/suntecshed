import { NextRequest, NextResponse } from "next/server";
import { getAdminPayload, unauthorized } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  const { id } = await params;
  try {
    const body = await req.json();
    const { categoryId, title, image, link, order, active } = body;

    let finalLink = link;
    if (categoryId && !link) {
      const cat = await prisma.category.findUnique({ where: { id: categoryId }, select: { slug: true } });
      if (cat) finalLink = `/produtos?categoria=${cat.slug}`;
    }

    const item = await prisma.homeCategoryItem.update({
      where: { id },
      data: { categoryId, title, image, link: finalLink, order, active },
    });
    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  const { id } = await params;
  try {
    await prisma.homeCategoryItem.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro ao excluir" }, { status: 500 });
  }
}
