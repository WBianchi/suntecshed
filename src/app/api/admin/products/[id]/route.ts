import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminPayload, unauthorized } from "@/lib/admin-auth";

// GET — Single product
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = getAdminPayload(req);
  if (!admin) return unauthorized();

  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { order: "asc" } },
        categories: { include: { category: { select: { id: true, name: true, slug: true } } } },
        variants: { orderBy: { createdAt: "asc" } },
        brand: true,
        relatedTo: true,
        buyTogetherTo: true,
        _count: { select: { reviews: true, orderItems: true, favorites: true } },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Product get error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// PUT — Update product
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = getAdminPayload(req);
  if (!admin) return unauthorized();

  try {
    const { id } = await params;
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

    // Busca valores atuais para detectar mudanças
    const current = await prisma.product.findUnique({
      where: { id },
      select: { id: true, name: true, price: true, stock: true },
    });

    if (!current) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
    }

    // Update product base fields
    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(slug !== undefined && { slug }),
        ...(description !== undefined && { description }),
        ...(shortDescription !== undefined && { shortDescription }),
        ...(sku !== undefined && { sku: sku || null }),
        ...(barcode !== undefined && { barcode: barcode || null }),
        ...(gtin !== undefined && { gtin: gtin || null }),
        ...(ncm !== undefined && { ncm: ncm || null }),
        ...(anatelHomologation !== undefined && { anatelHomologation: anatelHomologation || null }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(compareAtPrice !== undefined && { compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : null }),
        ...(costPrice !== undefined && { costPrice: costPrice ? parseFloat(costPrice) : null }),
        ...(weight !== undefined && { weight: weight ? parseFloat(weight) : null }),
        ...(width !== undefined && { width: width ? parseFloat(width) : null }),
        ...(height !== undefined && { height: height ? parseFloat(height) : null }),
        ...(length !== undefined && { length: length ? parseFloat(length) : null }),
        ...(stock !== undefined && { stock: parseInt(stock) }),
        ...(lowStockAlert !== undefined && { lowStockAlert: parseInt(lowStockAlert) }),
        ...(manageStock !== undefined && { manageStock }),
        ...(featured !== undefined && { featured }),
        ...(bestSeller !== undefined && { bestSeller }),
        ...(mostSearched !== undefined && { mostSearched }),
        ...(isNew !== undefined && { isNew }),
        ...(active !== undefined && { active }),
        ...(seoTitle !== undefined && { seoTitle }),
        ...(seoDescription !== undefined && { seoDescription }),
        ...(seoKeywords !== undefined && { seoKeywords }),
        ...(brandId !== undefined && { brandId: brandId || null }),
      },
    });

    // Registra log de alteração de preço
    if (price !== undefined) {
      const newPrice = parseFloat(price);
      if (newPrice !== current.price) {
        await prisma.productLog.create({
          data: {
            productId: id,
            productName: current.name,
            type: "PRICE_CHANGE",
            oldValue: current.price,
            newValue: newPrice,
          },
        });
      }
    }

    // Registra log de alteração de estoque
    if (stock !== undefined) {
      const newStock = parseInt(stock);
      if (newStock !== current.stock) {
        await prisma.productLog.create({
          data: {
            productId: id,
            productName: current.name,
            type: newStock === 0 ? "STOCK_OUT" : "STOCK_CHANGE",
            oldValue: current.stock,
            newValue: newStock,
          },
        });
      }
    }

    // Sync images if provided
    if (images !== undefined) {
      await prisma.productImage.deleteMany({ where: { productId: id } });
      if (images.length > 0) {
        await prisma.productImage.createMany({
          data: images.map((img: any, i: number) => ({
            productId: id,
            url: img.url,
            alt: img.alt || product.name,
            order: i,
            isPrimary: i === 0,
          })),
        });
      }
    }

    // Sync categories if provided
    if (categoryIds !== undefined) {
      await prisma.productCategory.deleteMany({ where: { productId: id } });
      if (categoryIds.length > 0) {
        await prisma.productCategory.createMany({
          data: categoryIds.map((catId: string) => ({ productId: id, categoryId: catId })),
        });
      }
    }

    // Sync variants if provided — explode comma-separated values into individual variants
    if (variants !== undefined) {
      const explodedVariants = variants.length > 0
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
        : [];

      await prisma.productVariant.deleteMany({ where: { productId: id } });
      if (explodedVariants.length > 0) {
        const newStock = stock !== undefined ? parseInt(stock) : product.stock;
        await prisma.productVariant.createMany({
          data: explodedVariants.map((v: any) => ({
            productId: id,
            name: v.name,
            value: v.value,
            tier: v.tier,
            price: v.price,
            // Se a variante de tier não tem estoque próprio definido, herda o estoque base
            stock: (v.tier && (!v.stock || v.stock === 0)) ? newStock : v.stock,
            sku: v.sku,
            image: v.image,
          })),
        });
      }
    } else if (stock !== undefined) {
      // Variants weren't sent — sync tier variants that have stock=0 with the new base stock
      const newStock = parseInt(stock);
      if (newStock > 0) {
        await prisma.productVariant.updateMany({
          where: { productId: id, tier: { not: null }, stock: 0 },
          data: { stock: newStock },
        });
      }
    }

    // Sync related products if provided
    if (relatedProductIds !== undefined) {
      await prisma.productRelation.deleteMany({ where: { productId: id } });
      if (relatedProductIds.length > 0) {
        await prisma.productRelation.createMany({
          data: relatedProductIds.map((relatedId: string) => ({ productId: id, relatedId })),
          skipDuplicates: true,
        });
      }
    }

    // Sync buy together products if provided
    if (buyTogetherIds !== undefined) {
      await prisma.productBuyTogether.deleteMany({ where: { productId: id } });
      if (buyTogetherIds.length > 0) {
        await prisma.productBuyTogether.createMany({
          data: buyTogetherIds.map((togetherId: string) => ({ productId: id, togetherId })),
          skipDuplicates: true,
        });
      }
    }

    // Return updated product
    const updated = await prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { order: "asc" } },
        categories: { include: { category: true } },
        variants: true,
        brand: true,
        relatedTo: { include: { related: { include: { images: { take: 1 } } } } },
        buyTogetherTo: { include: { together: { include: { images: { take: 1 } } } } },
      },
    });

    return NextResponse.json({ product: updated });
  } catch (error: any) {
    console.error("Product update error:", error);
    if (error.code === "P2002") {
      return NextResponse.json({ error: "SKU ou slug duplicado" }, { status: 409 });
    }
    return NextResponse.json({ error: "Erro ao atualizar produto" }, { status: 500 });
  }
}

// DELETE — Delete product
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = getAdminPayload(req);
  if (!admin) return unauthorized();

  try {
    const { id } = await params;

    // ProductClick has no FK relation, clean up manually
    await prisma.productClick.deleteMany({ where: { productId: id } });
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Product delete error:", error);
    return NextResponse.json({ error: "Erro ao excluir produto" }, { status: 500 });
  }
}
