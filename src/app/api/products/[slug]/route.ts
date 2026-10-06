import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        images: { orderBy: { order: "asc" } },
        categories: { include: { category: true } },
        variants: { orderBy: { name: "asc" } },
        brand: true,
        reviews: {
          where: { approved: true },
          orderBy: { createdAt: "desc" },
          include: { user: { select: { name: true } } },
        },
        relatedTo: {
          include: {
            related: {
              include: { images: { where: { isPrimary: true }, take: 1 } },
            },
          },
        },
        buyTogetherTo: {
          include: {
            together: {
              include: { images: { where: { isPrimary: true }, take: 1 } },
            },
          },
        },
      },
    });

    if (!product || !product.active) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
    }

    // Use explicit related products first, fallback to category-based
    let related: any[] = product.relatedTo
      .map((r) => r.related)
      .filter((r) => r.active);

    if (related.length < 4) {
      const categoryIds = product.categories.map((c) => c.categoryId);
      const excludeIds = [product.id, ...related.map((r) => r.id)];
      if (categoryIds.length > 0) {
        const catRelated = await prisma.product.findMany({
          where: {
            active: true,
            id: { notIn: excludeIds },
            categories: { some: { categoryId: { in: categoryIds } } },
          },
          include: { images: { where: { isPrimary: true }, take: 1 } },
          take: 12 - related.length,
          orderBy: { createdAt: "desc" },
        });
        related = [...related, ...catRelated];
      }
    }

    if (related.length < 4) {
      const moreProducts = await prisma.product.findMany({
        where: {
          active: true,
          id: { notIn: [product.id, ...related.map((r) => r.id)] },
        },
        include: { images: { where: { isPrimary: true }, take: 1 } },
        take: 12 - related.length,
        orderBy: { createdAt: "desc" },
      });
      related = [...related, ...moreProducts];
    }

    // Buy together products
    const buyTogether = product.buyTogetherTo
      .map((bt) => bt.together)
      .filter((p) => p.active)
      .map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        image: p.images[0]?.url || null,
      }));

    // Calculate average rating
    const avgRating =
      product.reviews.length > 0
        ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
        : 0;

    return NextResponse.json({
      ...product,
      relatedTo: undefined,
      buyTogetherTo: undefined,
      avgRating: Math.round(avgRating * 10) / 10,
      reviewCount: product.reviews.length,
      related: related.map((r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        price: r.price,
        compareAtPrice: r.compareAtPrice,
        image: r.images[0]?.url || null,
        featured: r.featured,
        bestSeller: r.bestSeller,
        isNew: r.isNew,
      })),
      buyTogether,
    });
  } catch (error: any) {
    console.error("Product fetch error:", error);
    return NextResponse.json({ error: "Erro ao buscar produto" }, { status: 500 });
  }
}
