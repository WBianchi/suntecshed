import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "24", 10)));
    const sort = searchParams.get("sort") || "relevance";
    const onSale = searchParams.get("onSale") === "true";
    const outOfStock = searchParams.get("outOfStock") === "true";

    const where: any = { active: true };
    if (onSale) where.compareAtPrice = { not: null };
    if (outOfStock) { where.manageStock = true; where.stock = { lte: 0 }; }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { shortDescription: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ];
    }

    if (category) {
      where.categories = {
        some: { category: { slug: category } },
      };
    }

    let orderBy: any = { createdAt: "desc" };
    if (sort === "price-asc") orderBy = { price: "asc" };
    else if (sort === "price-desc") orderBy = { price: "desc" };
    else if (sort === "name") orderBy = { name: "asc" };
    else if (sort === "best-sellers") orderBy = { bestSeller: "desc" };
    else if (sort === "newest") orderBy = { createdAt: "desc" };
    else if (sort === "relevance") orderBy = { createdAt: "desc" };
    // mantém compatibilidade com valores antigos
    else if (sort === "price_asc") orderBy = { price: "asc" };
    else if (sort === "price_desc") orderBy = { price: "desc" };
    else if (sort === "bestseller") orderBy = { bestSeller: "desc" };
    else if (sort === "recent") orderBy = { createdAt: "desc" };

    // Prisma can't compare two columns (compareAtPrice > price) in a `where`
    // clause, so for onSale we fetch the candidates and filter/paginate in JS.
    const [rawProducts, rawTotal] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          categories: { include: { category: { select: { name: true, slug: true } } } },
        },
        orderBy,
        ...(onSale ? {} : { skip: (page - 1) * limit, take: limit }),
      }),
      onSale ? Promise.resolve(0) : prisma.product.count({ where }),
    ]);

    let products = rawProducts;
    let total = rawTotal;
    if (onSale) {
      const filtered = rawProducts.filter((p) => p.compareAtPrice != null && p.compareAtPrice > p.price);
      total = filtered.length;
      products = filtered.slice((page - 1) * limit, page * limit);
    }

    return NextResponse.json({
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        image: p.images[0]?.url || null,
        featured: p.featured,
        bestSeller: p.bestSeller,
        isNew: p.isNew,
        stock: p.stock,
        manageStock: p.manageStock,
        categories: p.categories.map((c) => ({
          name: c.category.name,
          slug: c.category.slug,
        })),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error("Products fetch error:", error);
    return NextResponse.json({ error: "Erro ao buscar produtos" }, { status: 500 });
  }
}
