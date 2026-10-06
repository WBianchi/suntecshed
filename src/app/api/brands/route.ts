import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const brands = await prisma.brand.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
      include: { _count: { select: { products: true } } },
    });
    return NextResponse.json(
      brands.map((b) => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
        image: b.image,
        description: b.description,
        productCount: b._count.products,
      }))
    );
  } catch (error: any) {
    console.error("Brands fetch error:", error);
    return NextResponse.json({ error: "Erro ao buscar marcas" }, { status: 500 });
  }
}
