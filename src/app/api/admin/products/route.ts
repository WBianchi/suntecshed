import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminPayload, unauthorized } from "@/lib/admin-auth";

// GET — List products with filters
export async function GET(req: NextRequest) {
  const admin = getAdminPayload(req);
  if (!admin) return unauthorized();

  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("search") || "";
    const category = url.searchParams.get("category") || "";
    const status = url.searchParams.get("status") || "";
    const sort = url.searchParams.get("sort") || "createdAt";
    const order = url.searchParams.get("order") || "desc";
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { barcode: { contains: search, mode: "insensitive" } },
      ];
    }

    if (category) {
      where.categories = { some: { categoryId: category } };
    }

    if (status === "active") where.active = true;
    else if (status === "inactive") where.active = false;
    else if (status === "lowStock") {
      where.manageStock = true;
      where.stock = { lte: 5 };
    } else if (status === "outOfStock") {
      where.manageStock = true;
      where.stock = { lte: 0 };
    }

    const orderBy: any = {};
    if (sort === "name") orderBy.name = order;
    else if (sort === "price") orderBy.price = order;
    else if (sort === "stock") orderBy.stock = order;
    else orderBy.createdAt = order;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          images: { orderBy: { order: "asc" }, take: 1 },
          categories: { include: { category: { select: { id: true, name: true, slug: true } } } },
          variants: true,
          _count: { select: { reviews: true, orderItems: true, favorites: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products: products.map((p) => ({
        ...p,
        image: p.images[0]?.url || null,
        categoryNames: p.categories.map((c) => c.category.name),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Products list error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// DELETE — Bulk delete products
export async function DELETE(req: NextRequest) {
  const admin = getAdminPayload(req);
  if (!admin) return unauthorized();

  try {
    const { ids } = await req.json();
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "IDs inválidos" }, { status: 400 });
    }
    await prisma.product.deleteMany({ where: { id: { in: ids } } });
    return NextResponse.json({ deleted: ids.length });
  } catch (error) {
    console.error("Bulk delete error:", error);
    return NextResponse.json({ error: "Erro ao excluir produtos" }, { status: 500 });
  }
}

// POST — Create product
export async function POST(req: NextRequest) {
  const admin = getAdminPayload(req);
  if (!admin) return unauthorized();

  try {
    const body = await req.json();
    const {
      name, slug, description, shortDescription, sku, barcode, gtin, ncm, anatelHomologation,
      price, compareAtPrice, costPrice,
      weight, width, height, length,
      stock, lowStockAlert, manageStock,
      featured, bestSeller, mostSearched, isNew, active,
      seoTitle, seoDescription, seoKeywords,
      images, categoryIds, variants,
      brandId, relatedProductIds, buyTogetherIds,
    } = body;

    if (!name || !slug || price === undefined) {
      return NextResponse.json({ error: "Nome, slug e preço são obrigatórios" }, { status: 400 });
    }

    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: "Slug já existe" }, { status: 409 });
    }

    const productStock = stock ? parseInt(stock) : 0;

    // Explode variants with comma-separated values into individual variants
    const explodedVariants = variants?.length
      ? variants.flatMap((v: any) => {
          const values = v.value.split(",").map((s: string) => s.trim()).filter((s: string) => s.length > 0);
          return values.map((val: string) => ({
            name: v.name,
            value: val,
            tier: v.tier || null,
            price: v.price ? parseFloat(v.price) : null,
            stock: v.stock ? parseInt(v.stock) : 0,
            sku: v.sku || null,
            image: v.image || null,
          }));
        })
      : undefined;

    const product = await prisma.product.create({
      data: {
        name, slug, description, shortDescription, sku, barcode, gtin, ncm, anatelHomologation,
        price: parseFloat(price),
        compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : null,
        costPrice: costPrice ? parseFloat(costPrice) : null,
        weight: weight ? parseFloat(weight) : null,
        width: width ? parseFloat(width) : null,
        height: height ? parseFloat(height) : null,
        length: length ? parseFloat(length) : null,
        stock: productStock,
        lowStockAlert: lowStockAlert ? parseInt(lowStockAlert) : 5,
        manageStock: manageStock ?? true,
        featured: featured ?? false,
        bestSeller: bestSeller ?? false,
        mostSearched: mostSearched ?? false,
        isNew: isNew ?? false,
        active: active ?? true,
        seoTitle, seoDescription, seoKeywords,
        brandId: brandId || null,
        images: images?.length
          ? { create: images.map((img: any, i: number) => ({ url: img.url, alt: img.alt || name, order: i, isPrimary: i === 0 })) }
          : undefined,
        categories: categoryIds?.length
          ? { create: categoryIds.map((catId: string) => ({ categoryId: catId })) }
          : undefined,
        variants: explodedVariants?.length
          ? { create: explodedVariants }
          : undefined,
      },
      include: {
        images: true,
        categories: { include: { category: true } },
        variants: true,
      },
    });

    // Sincroniza o estoque base com variantes de tier (Dropshipping, Atacado, Grupo VIP)
    // que foram criadas sem estoque próprio — assim o produto não aparece "Esgotado"
    // quando o admin define estoque só no campo base.
    if (explodedVariants?.length && productStock > 0) {
      await prisma.productVariant.updateMany({
        where: { productId: product.id, tier: { not: null }, stock: 0 },
        data: { stock: productStock },
      });
    }

    // Create related products
    if (relatedProductIds?.length) {
      await prisma.productRelation.createMany({
        data: relatedProductIds.map((relatedId: string) => ({ productId: product.id, relatedId })),
        skipDuplicates: true,
      });
    }

    // Create buy together products
    if (buyTogetherIds?.length) {
      await prisma.productBuyTogether.createMany({
        data: buyTogetherIds.map((togetherId: string) => ({ productId: product.id, togetherId })),
        skipDuplicates: true,
      });
    }

    return NextResponse.json({ product }, { status: 201 });
  } catch (error: any) {
    console.error("Product create error:", error);
    if (error.code === "P2002") {
      return NextResponse.json({ error: "SKU ou slug duplicado" }, { status: 409 });
    }
    return NextResponse.json({ error: "Erro ao criar produto" }, { status: 500 });
  }
}
