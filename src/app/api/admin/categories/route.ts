import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminPayload, unauthorized } from "@/lib/admin-auth";

// GET — List all categories
export async function GET(req: NextRequest) {
  const admin = getAdminPayload(req);
  if (!admin) return unauthorized();

  try {
    const categories = await prisma.category.findMany({
      orderBy: { order: "asc" },
      include: {
        parent: { select: { id: true, name: true } },
        children: { select: { id: true, name: true, slug: true } },
        _count: { select: { products: true } },
      },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Categories list error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// POST — Create category
export async function POST(req: NextRequest) {
  const admin = getAdminPayload(req);
  if (!admin) return unauthorized();

  try {
    const body = await req.json();
    const { name, slug, description, image, icon, parentId, featured, order } = body;

    if (!name || !slug) {
      return NextResponse.json({ error: "Nome e slug são obrigatórios" }, { status: 400 });
    }

    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: "Slug já existe" }, { status: 409 });
    }

    const category = await prisma.category.create({
      data: {
        name, slug, description, image, icon,
        parentId: parentId || null,
        featured: featured ?? false,
        order: order ?? 0,
      },
      include: {
        parent: { select: { id: true, name: true } },
        _count: { select: { products: true } },
      },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error("Category create error:", error);
    return NextResponse.json({ error: "Erro ao criar categoria" }, { status: 500 });
  }
}
