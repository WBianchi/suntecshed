import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { order: "asc" },
      include: {
        _count: {
          select: {
            products: { where: { product: { active: true } } },
          },
        },
      },
    });

    return NextResponse.json(
      categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        image: c.image,
        icon: c.icon,
        featured: c.featured,
        parentId: c.parentId,
        productCount: c._count.products,
      }))
    );
  } catch (error: any) {
    console.error("Categories fetch error:", error);
    return NextResponse.json({ error: "Erro ao buscar categorias" }, { status: 500 });
  }
}
