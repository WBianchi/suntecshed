import mysql from "mysql2/promise";
import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

const TIER_BY_SLUG: Record<string, "DROPSHIPPING" | "ATACADO" | "GRUPO_VIP"> = {
  dropshipping: "DROPSHIPPING",
  atacado: "ATACADO",
  "grupo-vip": "GRUPO_VIP",
};

const PRODUCT_META_KEYS = ["_price", "_stock", "_sku", "_thumbnail_id"];

async function main() {
  const conn = await mysql.createConnection({
    host: "127.0.0.1", port: 33066, user: "root", password: "rootpass", database: "c7dr_site",
  });

  const attrLabel = new Map<string, string>(
    (await conn.query<any[]>(`SELECT DISTINCT attribute_name, attribute_label FROM nw_woocommerce_attribute_taxonomies`))[0]
      .map((r) => [r.attribute_name, r.attribute_label])
  );

  const termDisplayName = new Map<string, string>(
    (await conn.query<any[]>(
      `SELECT tt.taxonomy, t.slug, t.name FROM nw_term_taxonomy tt
       JOIN nw_terms t ON t.term_id = tt.term_id WHERE tt.taxonomy LIKE 'pa\\_%'`
    ))[0].map((r) => [`${r.taxonomy}::${r.slug}`, r.name])
  );

  const [wcProductRows] = await conn.query<any[]>(`SELECT ID, post_name FROM nw_posts WHERE post_type='product'`);
  const wcIdToSlug = new Map<number, string>(wcProductRows.map((r) => [r.ID, r.post_name]));

  const [attachRows] = await conn.query<any[]>(`SELECT ID, guid FROM nw_posts WHERE post_type='attachment'`);
  const attachmentUrl = new Map<number, string>(
    attachRows.map((r) => [r.ID, r.guid.replace("cemstoretec.com.br", "c7drop.com.br")])
  );

  const [variationRows] = await conn.query<any[]>(
    `SELECT p.ID, p.post_parent,
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

  const productSlugToId = new Map<string, string>();
  const allProducts = await prisma.product.findMany({ select: { id: true, slug: true, sku: true } });
  const productSlugToSku = new Map<string, string | null>();
  for (const p of allProducts) {
    productSlugToId.set(p.slug, p.id);
    productSlugToSku.set(p.slug, p.sku);
  }

  const variantRecords: any[] = [];
  let skippedNoParent = 0;
  let skippedNoTier = 0;

  for (const v of variationRows) {
    const parentSlug = wcIdToSlug.get(v.post_parent);
    if (!parentSlug) { skippedNoParent++; continue; }
    const productId = productSlugToId.get(parentSlug);
    if (!productId) { skippedNoParent++; continue; }

    const attrs = variationAttrs.get(v.ID) || [];
    if (attrs.length === 0) continue;

    // Separa o eixo "Compra" (tier de preço) dos demais atributos reais (cor/tamanho/etc)
    const compraAttr = attrs.find((a) => a.taxonomy === "pa_compra");
    const otherAttrs = attrs.filter((a) => a.taxonomy !== "pa_compra");

    const tier = compraAttr ? TIER_BY_SLUG[compraAttr.value] : undefined;
    if (compraAttr && !tier) { skippedNoTier++; continue; } // termo legado (ex: "10 Anúncios"), fora do escopo dos 3 tiers

    const resolvedOthers = otherAttrs.map(({ taxonomy, value }) => {
      const attrName = taxonomy.replace(/^pa_/, "");
      const label = attrLabel.get(attrName) || attrName;
      const displayValue = termDisplayName.get(`${taxonomy}::${value}`) || value;
      return { label, displayValue };
    });

    let name: string;
    let value: string;
    if (resolvedOthers.length === 0) {
      // variação só tem o tier de compra, sem atributo real (cor/tamanho) — não há o que escolher além do tier
      name = "Compra";
      value = compraAttr ? termDisplayName.get(`pa_compra::${compraAttr.value}`) || compraAttr.value : "Padrão";
    } else if (resolvedOthers.length === 1) {
      name = resolvedOthers[0].label;
      value = resolvedOthers[0].displayValue;
    } else {
      name = "Variação";
      value = resolvedOthers.map((r) => r.displayValue).join(" / ");
    }

    const price = parseFloat(v._price || "0") || null;
    const thumbId = v._thumbnail_id ? parseInt(v._thumbnail_id, 10) : null;
    const image = thumbId ? attachmentUrl.get(thumbId) || null : null;

    variantRecords.push({
      productId,
      name,
      value,
      tier: tier || null,
      price,
      stock: v._stock ? Math.max(0, Math.round(parseFloat(v._stock))) : 0,
      sku: v._sku || productSlugToSku.get(parentSlug) || null,
      image,
    });
  }

  console.log(`Removendo variantes antigas e inserindo ${variantRecords.length} novas (${skippedNoParent} sem produto pai, ${skippedNoTier} com termo de tier legado ignorado)...`);
  await prisma.productVariant.deleteMany({});
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
