/**
 * Importa produtos do dump do projeto antigo (C7drop) pro banco do Suntecshed.
 *
 * Uso:
 *   npx tsx scripts/import-products.ts [caminho-do-json]
 *
 * Padrão: scripts/data/produtos-c7drop.json (dump read-only feito no c7drop:
 * produtos ativos com imagem, sorteados aleatoriamente, com imagens, variantes,
 * categorias e marca).
 *
 * Regras:
 * - pula produto cujo slug já existe (rodar de novo não duplica);
 * - marca (brand) é criada se não existir;
 * - categoria só é vinculada se existir aqui (as do seed-categories.ts existem);
 * - sku que colidir com um sku já existente é descartado (é @unique no schema);
 * - imagens continuam apontando pro Vercel Blob do projeto antigo.
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

type VarianteJson = {
  name: string;
  value: string;
  tier: string | null;
  price: number | null;
  stock: number;
  sku: string | null;
  image: string | null;
};

type ProdutoJson = {
  name: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  sku: string | null;
  barcode: string | null;
  gtin: string | null;
  ncm: string | null;
  linha: string | null;
  price: number;
  compareAtPrice: number | null;
  costPrice: number | null;
  weight: number | null;
  width: number | null;
  height: number | null;
  length: number | null;
  stock: number;
  lowStockAlert: number;
  manageStock: boolean;
  featured: boolean;
  bestSeller: boolean;
  mostSearched: boolean;
  isNew: boolean;
  seoTitle: string | null;
  seoDescription: string | null;
  brand: { name: string; slug: string; image: string | null } | null;
  categories: string[];
  images: { url: string; alt: string | null; order: number; isPrimary: boolean }[];
  variants: VarianteJson[];
};

const TIERS = ["DROPSHIPPING", "ATACADO", "GRUPO_VIP"] as const;

function tierValido(tier: string | null): (typeof TIERS)[number] | null {
  return tier && (TIERS as readonly string[]).includes(tier) ? (tier as (typeof TIERS)[number]) : null;
}

async function main() {
  const caminho = process.argv[2] ?? path.join(process.cwd(), "scripts/data/produtos-c7drop.json");
  const produtos: ProdutoJson[] = JSON.parse(readFileSync(caminho, "utf8"));
  console.log(`arquivo: ${caminho} (${produtos.length} produtos)`);

  let importados = 0;
  let pulados = 0;
  let marcasCriadas = 0;
  let semCategoria = 0;

  for (const p of produtos) {
    const jaExiste = await prisma.product.findUnique({ where: { slug: p.slug }, select: { id: true } });
    if (jaExiste) {
      console.log(`  = pulado (slug já existe): ${p.slug}`);
      pulados++;
      continue;
    }

    let brandId: string | null = null;
    if (p.brand?.slug) {
      const existente = await prisma.brand.findUnique({ where: { slug: p.brand.slug }, select: { id: true } });
      if (existente) {
        brandId = existente.id;
      } else {
        const nova = await prisma.brand.create({
          data: { name: p.brand.name, slug: p.brand.slug, image: p.brand.image },
          select: { id: true },
        });
        brandId = nova.id;
        marcasCriadas++;
      }
    }

    const categorias = p.categories.length
      ? await prisma.category.findMany({ where: { slug: { in: p.categories } }, select: { id: true } })
      : [];
    if (p.categories.length && categorias.length === 0) semCategoria++;

    let sku = p.sku;
    if (sku) {
      const skuEmUso = await prisma.product.findUnique({ where: { sku }, select: { id: true } });
      if (skuEmUso) sku = null;
    }

    await prisma.product.create({
      data: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        shortDescription: p.shortDescription,
        sku,
        barcode: p.barcode,
        gtin: p.gtin,
        ncm: p.ncm,
        linha: p.linha,
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        costPrice: p.costPrice,
        weight: p.weight,
        width: p.width,
        height: p.height,
        length: p.length,
        stock: p.stock,
        lowStockAlert: p.lowStockAlert,
        manageStock: p.manageStock,
        featured: p.featured,
        bestSeller: p.bestSeller,
        mostSearched: p.mostSearched,
        isNew: p.isNew,
        active: true,
        seoTitle: p.seoTitle,
        seoDescription: p.seoDescription,
        brandId,
        images: {
          create: p.images.map((img, i) => ({
            url: img.url,
            alt: img.alt ?? p.name,
            order: img.order ?? i,
            isPrimary: img.isPrimary,
          })),
        },
        variants: {
          create: p.variants.map((v) => ({
            name: v.name,
            value: v.value,
            tier: tierValido(v.tier),
            price: v.price,
            stock: v.stock,
            sku: v.sku,
            image: v.image,
          })),
        },
        categories: { create: categorias.map((c) => ({ categoryId: c.id })) },
      },
    });

    importados++;
    console.log(`  + ${p.name.slice(0, 60)} (${p.images.length} img, ${p.variants.length} var, ${categorias.length} cat)`);
  }

  console.log(
    `\nimportados: ${importados} | pulados: ${pulados} | marcas criadas: ${marcasCriadas} | produtos sem categoria correspondente: ${semCategoria}`,
  );
  console.log("total de produtos no banco agora:", await prisma.product.count());
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
