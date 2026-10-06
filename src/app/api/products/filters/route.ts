import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || "";

    // Base where clause
    const where: any = { active: true };
    if (category) {
      where.categories = {
        some: { category: { slug: category } },
      };
    }

    // 1. Price stats (min, max, avg)
    const priceAgg = await prisma.product.aggregate({
      where,
      _min: { price: true },
      _max: { price: true },
      _count: true,
    });

    const minPrice = Math.floor(priceAgg._min.price || 0);
    const maxPrice = Math.ceil(priceAgg._max.price || 500);
    const productCount = priceAgg._count;

    // Dynamic price ranges
    const priceRanges = buildPriceRanges(minPrice, maxPrice, where);

    // 2. Variant-based filters (colors, sizes, materials)
    const variantGroups = await prisma.productVariant.groupBy({
      by: ["name", "value"],
      where: {
        product: where,
      },
      _count: true,
      orderBy: { _count: { value: "desc" } },
    });

    // Group by normalized variant name
    const colors: { label: string; value: string; count: number }[] = [];
    const sizes: { label: string; value: string; count: number }[] = [];
    const materials: { label: string; value: string; count: number }[] = [];

    for (const v of variantGroups) {
      const normalizedName = v.name.toLowerCase().trim();
      const entry = {
        label: v.value,
        value: v.value.toLowerCase().replace(/\s+/g, "-"),
        count: v._count,
      };

      if (normalizedName.includes("cor") || normalizedName.includes("color")) {
        colors.push(entry);
      } else if (
        normalizedName.includes("tamanho") ||
        normalizedName.includes("size")
      ) {
        sizes.push(entry);
      } else if (
        normalizedName.includes("material") ||
        normalizedName.includes("tecido") ||
        normalizedName.includes("composi")
      ) {
        materials.push(entry);
      }
    }

    // 3. Rating aggregation
    const ratingAgg = await prisma.review.groupBy({
      by: ["rating"],
      where: {
        product: where,
      },
      _count: true,
    });

    const ratings = buildRatings(ratingAgg);

    return NextResponse.json({
      priceRanges,
      colors,
      sizes,
      materials,
      ratings,
      totalProducts: productCount,
    });
  } catch (error: any) {
    console.error("Filters fetch error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar filtros" },
      { status: 500 }
    );
  }
}

async function buildPriceRanges(
  min: number,
  max: number,
  where: any
): Promise<{ label: string; value: string; count: number }[]> {
  // Create 4-5 buckets dynamically
  const range = max - min;
  if (range <= 0) return [];

  const buckets = 5;
  const step = Math.ceil(range / buckets);

  const ranges: { label: string; value: string; count: number }[] = [];

  for (let i = 0; i < buckets; i++) {
    const low = min + i * step;
    const high = i === buckets - 1 ? max + 1 : low + step;

    const count = await prisma.product.count({
      where: {
        ...where,
        price: { gte: low, lt: high },
      },
    });

    if (count > 0) {
      const label =
        i === buckets - 1
          ? `Acima de R$${low.toFixed(0)}`
          : `R$${low.toFixed(0)} - R$${(high - 1).toFixed(0)}`;
      ranges.push({ label, value: `${low}-${high - 1}`, count });
    }
  }

  return ranges;
}

function buildRatings(
  agg: { rating: number; _count: number }[]
): { label: string; value: string; count: number }[] {
  const ratingMap = new Map<number, number>();
  for (const r of agg) {
    ratingMap.set(r.rating, r._count);
  }

  return [
    {
      label: "5 estrelas",
      value: "5",
      count: ratingMap.get(5) || 0,
    },
    {
      label: "4 estrelas ou mais",
      value: "4",
      count: (ratingMap.get(4) || 0) + (ratingMap.get(5) || 0),
    },
    {
      label: "3 estrelas ou mais",
      value: "3",
      count:
        (ratingMap.get(3) || 0) +
        (ratingMap.get(4) || 0) +
        (ratingMap.get(5) || 0),
    },
  ];
}
