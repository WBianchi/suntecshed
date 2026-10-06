import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminPayload, unauthorized } from "@/lib/admin-auth";

// PUT — Update category
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = getAdminPayload(req);
  if (!admin) return unauthorized();

  try {
    const { id } = await params;
    const body = await req.json();
    const { name, slug, description, image, icon, parentId, featured, order } = body;

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(slug !== undefined && { slug }),
        ...(description !== undefined && { description }),
        ...(image !== undefined && { image }),
        ...(icon !== undefined && { icon }),
        ...(parentId !== undefined && { parentId: parentId || null }),
        ...(featured !== undefined && { featured }),
        ...(order !== undefined && { order }),
      },
      include: {
        parent: { select: { id: true, name: true } },
        _count: { select: { products: true } },
      },
    });

    return NextResponse.json({ category });
  } catch (error: any) {
    console.error("Category update error:", error);
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Slug já existe" }, { status: 409 });
    }
    return NextResponse.json({ error: "Erro ao atualizar categoria" }, { status: 500 });
  }
}

// DELETE — Delete category
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = getAdminPayload(req);
  if (!admin) return unauthorized();

  try {
    const { id } = await params;
    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Category delete error:", error);
    return NextResponse.json({ error: "Erro ao excluir categoria" }, { status: 500 });
  }
}
