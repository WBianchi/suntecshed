import mysql from "mysql2/promise";
import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

const OLD_DOMAIN = "cemstoretec.com.br";
const CURRENT_DOMAIN = "c7drop.com.br";

function fixImageUrl(guid: string): string {
  return guid.replace(OLD_DOMAIN, CURRENT_DOMAIN);
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

const PRODUCT_META_KEYS = [
  "_price", "_regular_price", "_sale_price", "_sku", "_stock", "_stock_status",
  "_manage_stock", "_weight", "_length", "_width", "_height",
  "_thumbnail_id", "_product_image_gallery", "1_ean", "1_ncm",
];

async function main() {
  const existingProducts = await prisma.product.count();
  if (existingProducts > 0) {
    console.log(`Já existem ${existingProducts} produtos, abortando para evitar duplicar.`);
    return;
  }

  const conn = await mysql.createConnection({
    host: "127.0.0.1", port: 33066, user: "root", password: "rootpass", database: "c7dr_site",
  });

  // ---------- Attribute labels ----------
  const [attrRows] = await conn.query<any[]>(
    `SELECT DISTINCT attribute_name, attribute_label FROM nw_woocommerce_attribute_taxonomies`
  );
  const attrLabel = new Map<string, string>(attrRows.map((r) => [r.attribute_name, r.attribute_label]));

  // ---------- Categories ----------
  const [catRows] = await conn.query<any[]>(
    `SELECT t.term_id, t.name, t.slug, tt.count FROM nw_terms t
     JOIN nw_term_taxonomy tt ON tt.term_id = t.term_id
     WHERE tt.taxonomy = 'product_cat'`
  );
  console.log(`${catRows.length} categorias encontradas`);

  const categoryIdMap = new Map<number, string>(); // wc term_id -> prisma category id
  for (const cat of catRows) {
    const name = (cat.name as string).replace(/&amp;/g, "&");
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name },
      create: { name, slug: cat.slug, order: 0 },
    });
    categoryIdMap.set(cat.term_id, created.id);
  }

  // Map: product post_id -> [term_id]
  const [catRelRows] = await conn.query<any[]>(
    `SELECT tr.object_id, tr.term_taxonomy_id, tt.term_id FROM nw_term_relationships tr
     JOIN nw_term_taxonomy tt ON tt.term_taxonomy_id = tr.term_taxonomy_id
     WHERE tt.taxonomy = 'product_cat'`
  );
  const productCategoryTermIds = new Map<number, number[]>();
  for (const row of catRelRows) {
    const list = productCategoryTermIds.get(row.object_id) || [];
    list.push(row.term_id);
    productCategoryTermIds.set(row.object_id, list);
  }

  // ---------- Attachments (images) ----------
  const [attachRows] = await conn.query<any[]>(
    `SELECT ID, guid FROM nw_posts WHERE post_type='attachment'`
  );
  const attachmentUrl = new Map<number, string>(attachRows.map((r) => [r.ID, fixImageUrl(r.guid)]));

  // ---------- Parent products ----------
  const [productRows] = await conn.query<any[]>(
    `SELECT p.ID, p.post_title, p.post_name, p.post_content, p.post_excerpt,
      ${PRODUCT_META_KEYS.map((k) => `MAX(CASE WHEN pm.meta_key='${k}' THEN pm.meta_value END) AS \`${k}\``).join(",\n      ")}
     FROM nw_posts p
     LEFT JOIN nw_postmeta pm ON pm.post_id = p.ID AND pm.meta_key IN (${PRODUCT_META_KEYS.map(() => "?").join(",")})
     WHERE p.post_type='product' AND p.post_status='publish'
     GROUP BY p.ID`,
    PRODUCT_META_KEYS
  );
  console.log(`${productRows.length} produtos publicados encontrados`);

  const wcIdToSlug = new Map<number, string>();
  const skuSeen = new Set<string>();

  for (const batchRows of chunk(productRows, 300)) {
    for (const p of batchRows) {
      const price = parseFloat(p._sale_price || p._price || "0") || 0;
      const regular = parseFloat(p._regular_price || "0") || 0;
      const compareAtPrice = regular && regular > price ? regular : null;

      let sku: string | null = p._sku || null;
      if (sku) {
        if (skuSeen.has(sku)) sku = `${sku}-${p.ID}`;
        skuSeen.add(sku);
      }

      const slug = p.post_name || slugify(p.post_title);
      wcIdToSlug.set(p.ID, slug);

      const galleryIds: number[] = (p._product_image_gallery || "")
        .split(",").map((s: string) => parseInt(s.trim(), 10)).filter((n: number) => !isNaN(n));
      const thumbId = p._thumbnail_id ? parseInt(p._thumbnail_id, 10) : null;

      const imageIds = [thumbId, ...galleryIds].filter((id): id is number => !!id && attachmentUrl.has(id));
      const uniqueImageIds = [...new Set(imageIds)];

      const product = await prisma.product.upsert({
        where: { slug },
        update: {},
        create: {
          name: p.post_title,
          slug,
          description: p.post_content || null,
          shortDescription: p.post_excerpt || null,
          sku,
          gtin: p["1_ean"] || null,
          ncm: p["1_ncm"] || null,
          price,
          compareAtPrice,
          weight: p._weight ? parseFloat(p._weight) : null,
          width: p._width ? parseFloat(p._width) : null,
          height: p._height ? parseFloat(p._height) : null,
          length: p._length ? parseFloat(p._length) : null,
          stock: p._stock ? Math.max(0, Math.round(parseFloat(p._stock))) : 0,
          manageStock: p._manage_stock === "yes",
          active: true,
        },
      });

      if (uniqueImageIds.length > 0) {
        await prisma.productImage.createMany({
          data: uniqueImageIds.map((imgId, idx) => ({
            productId: product.id,
            url: attachmentUrl.get(imgId)!,
            isPrimary: idx === 0,
            order: idx,
          })),
        });
      }

      const termIds = productCategoryTermIds.get(p.ID) || [];
      const categoryData = termIds
        .map((tid) => categoryIdMap.get(tid))
        .filter((cid): cid is string => !!cid)
        .map((categoryId) => ({ productId: product.id, categoryId }));
      if (categoryData.length > 0) {
        await prisma.productCategory.createMany({ data: categoryData, skipDuplicates: true });
      }
    }
    console.log(`Processados ${batchRows.length} produtos deste lote...`);
  }

  console.log("Produtos, imagens e categorias importados.");

  // ---------- Variations ----------
  const [variationRows] = await conn.query<any[]>(
    `SELECT p.ID, p.post_parent, p.post_title,
      ${PRODUCT_META_KEYS.map((k) => `MAX(CASE WHEN pm.meta_key='${k}' THEN pm.meta_value END) AS \`${k}\``).join(",\n      ")}
     FROM nw_posts p
     LEFT JOIN nw_postmeta pm ON pm.post_id = p.ID AND pm.meta_key IN (${PRODUCT_META_KEYS.map(() => "?").join(",")})
     WHERE p.post_type='product_variation' AND p.post_status='publish'
     GROUP BY p.ID`,
    PRODUCT_META_KEYS
  );
  console.log(`${variationRows.length} variações encontradas`);

  const [attrMetaRows] = await conn.query<any[]>(
    `SELECT post_id, meta_key, meta_value FROM nw_postmeta
     WHERE meta_key LIKE 'attribute\\_%' AND post_id IN (
       SELECT ID FROM nw_posts WHERE post_type='product_variation' AND post_status='publish'
     )`
  );
  const variationAttrs = new Map<number, { taxonomy: string; value: string }[]>();
  for (const row of attrMetaRows) {
    if (!row.meta_value) continue;
    const taxonomy = (row.meta_key as string).replace(/^attribute_/, "");
    const list = variationAttrs.get(row.post_id) || [];
    list.push({ taxonomy, value: row.meta_value });
    variationAttrs.set(row.post_id, list);
  }

  // Resolve pa_* term slugs -> display names
  const [termNameRows] = await conn.query<any[]>(
    `SELECT tt.taxonomy, t.slug, t.name FROM nw_term_taxonomy tt
     JOIN nw_terms t ON t.term_id = tt.term_id
     WHERE tt.taxonomy LIKE 'pa\\_%'`
  );
  const termDisplayName = new Map<string, string>(
    termNameRows.map((r) => [`${r.taxonomy}::${r.slug}`, r.name])
  );

  const productSlugToId = new Map<string, string>();
  const productSlugToSku = new Map<string, string | null>();
  const allProducts = await prisma.product.findMany({ select: { id: true, slug: true, sku: true } });
  for (const p of allProducts) {
    productSlugToId.set(p.slug, p.id);
    productSlugToSku.set(p.slug, p.sku);
  }

  const variantRecords: any[] = [];

  for (const v of variationRows) {
    const parentSlug = wcIdToSlug.get(v.post_parent);
    if (!parentSlug) continue;
    const productId = productSlugToId.get(parentSlug);
    if (!productId) continue;

    const attrs = variationAttrs.get(v.ID) || [];
    if (attrs.length === 0) continue;

    const resolved = attrs.map(({ taxonomy, value }) => {
      const attrName = taxonomy.replace(/^pa_/, "");
      const label = attrLabel.get(attrName) || attrName;
      const displayValue = termDisplayName.get(`${taxonomy}::${value}`) || value;
      return { label, displayValue };
    });

    const name = resolved.length === 1 ? resolved[0].label : "Variação";
    const value = resolved.map((r) => r.displayValue).join(" / ");

    const price = parseFloat(v._price || "0") || null;
    const thumbId = v._thumbnail_id ? parseInt(v._thumbnail_id, 10) : null;
    const image = thumbId ? attachmentUrl.get(thumbId) || null : null;

    variantRecords.push({
      productId,
      name,
      value,
      price,
      stock: v._stock ? Math.max(0, Math.round(parseFloat(v._stock))) : 0,
      // WooCommerce mostra o SKU do produto pai quando a variação não tem o próprio
      sku: v._sku || productSlugToSku.get(parentSlug) || null,
      image,
    });
  }

  console.log(`Inserindo ${variantRecords.length} variantes...`);
  for (const batch of chunk(variantRecords, 1000)) {
    await prisma.productVariant.createMany({ data: batch });
  }

  console.log("Concluído.");
  await conn.end();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
