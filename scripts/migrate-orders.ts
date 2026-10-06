import mysql from "mysql2/promise";
import { randomUUID } from "crypto";
import argon2 from "argon2";
import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function validDate(raw: string | Date | null): Date {
  if (!raw) return new Date();
  const d = raw instanceof Date ? raw : new Date(String(raw).replace(" ", "T") + "Z");
  if (isNaN(d.getTime()) || d.getFullYear() < 1971) return new Date();
  return d;
}

const STATUS_MAP: Record<string, { status: string; paymentStatus: string }> = {
  "wc-pagamento-aprova": { status: "PAYMENT_CONFIRMED", paymentStatus: "CONFIRMED" },
  "wc-pedido-enviado": { status: "SHIPPED", paymentStatus: "CONFIRMED" },
  "wc-on-hold": { status: "AWAITING_PAYMENT", paymentStatus: "PENDING" },
  "wc-pending": { status: "PENDING", paymentStatus: "PENDING" },
  "wc-cancelled": { status: "CANCELLED", paymentStatus: "CANCELLED" },
  "wc-refunded": { status: "REFUNDED", paymentStatus: "REFUNDED" },
  "wc-failed": { status: "CANCELLED", paymentStatus: "FAILED" },
  "wc-ausencia-da-etiqu": { status: "PROCESSING", paymentStatus: "CONFIRMED" },
  "wc-erro-no-pedido": { status: "CANCELLED", paymentStatus: "FAILED" },
  "wc-completed": { status: "DELIVERED", paymentStatus: "CONFIRMED" },
};

function mapPaymentMethod(raw: string | null): string | null {
  if (!raw) return null;
  const v = raw.toLowerCase();
  if (v.includes("pix")) return "PIX";
  if (v.includes("boleto") || v.includes("billet")) return "BOLETO";
  if (v.includes("credit") || v === "credit") return "CREDIT_CARD";
  return null;
}

const ORDER_META_KEYS = [
  "_customer_user", "_order_total", "_order_shipping", "_cart_discount", "_payment_method",
  "_order_currency", "_order_key", "_paid_date", "_date_paid",
  "_billing_first_name", "_billing_last_name", "_billing_email", "_billing_phone", "_billing_cellphone",
  "_billing_cpf", "_billing_cnpj", "_billing_address_1", "_billing_address_2", "_billing_number",
  "_billing_neighborhood", "_billing_city", "_billing_state", "_billing_postcode",
  "_shipping_first_name", "_shipping_last_name", "_shipping_address_1", "_shipping_number",
  "_shipping_neighborhood", "_shipping_city", "_shipping_state", "_shipping_postcode",
  "melhorenvio_tracking", "_correios_tracking_code",
];

async function main() {
  const existingOrders = await prisma.order.count();
  if (existingOrders > 0) {
    console.log(`Já existem ${existingOrders} pedidos, abortando para evitar duplicar.`);
    return;
  }

  const conn = await mysql.createConnection({
    host: "127.0.0.1", port: 33066, user: "root", password: "rootpass", database: "c7dr_site",
  });

  // ---------- User mapping: wc user id -> our User id (via email) ----------
  const [wcUserRows] = await conn.query<any[]>(`SELECT ID, user_email FROM nw_users`);
  const wcUserIdToEmail = new Map<number, string>(wcUserRows.map((r) => [r.ID, r.user_email.toLowerCase().trim()]));

  const ourUsers = await prisma.user.findMany({ select: { id: true, email: true } });
  const emailToUserId = new Map(ourUsers.map((u) => [u.email.toLowerCase().trim(), u.id]));

  // ---------- Product mapping: wc product id -> our Product id ----------
  const [wcProductRows] = await conn.query<any[]>(
    `SELECT ID, post_name, post_parent, post_type FROM nw_posts WHERE post_type IN ('product','product_variation')`
  );
  const wcIdToSlug = new Map<number, string>();
  const wcVariationParent = new Map<number, number>();
  for (const r of wcProductRows) {
    if (r.post_type === "product") wcIdToSlug.set(r.ID, r.post_name);
    else wcVariationParent.set(r.ID, r.post_parent);
  }
  const ourProducts = await prisma.product.findMany({ select: { id: true, slug: true, images: { take: 1, orderBy: { order: "asc" } } } });
  const slugToProduct = new Map(ourProducts.map((p) => [p.slug, p]));

  // ---------- Variation attribute descriptions (wc variation id -> "Cor / Tamanho" string) ----------
  const [attrRows] = await conn.query<any[]>(
    `SELECT DISTINCT attribute_name, attribute_label FROM nw_woocommerce_attribute_taxonomies`
  );
  const attrLabel = new Map<string, string>(attrRows.map((r) => [r.attribute_name, r.attribute_label]));

  const [termNameRows] = await conn.query<any[]>(
    `SELECT tt.taxonomy, t.slug, t.name FROM nw_term_taxonomy tt
     JOIN nw_terms t ON t.term_id = tt.term_id WHERE tt.taxonomy LIKE 'pa\\_%'`
  );
  const termDisplayName = new Map<string, string>(termNameRows.map((r) => [`${r.taxonomy}::${r.slug}`, r.name]));

  const [variationAttrMetaRows] = await conn.query<any[]>(
    `SELECT post_id, meta_key, meta_value FROM nw_postmeta
     WHERE meta_key LIKE 'attribute\\_%' AND post_id IN (SELECT ID FROM nw_posts WHERE post_type='product_variation')`
  );
  const variationDescription = new Map<number, string>();
  const variationAttrsTmp = new Map<number, { label: string; value: string }[]>();
  for (const row of variationAttrMetaRows) {
    if (!row.meta_value) continue;
    const taxonomy = (row.meta_key as string).replace(/^attribute_/, "");
    const attrName = taxonomy.replace(/^pa_/, "");
    const label = attrLabel.get(attrName) || attrName;
    const displayValue = termDisplayName.get(`${taxonomy}::${row.meta_value}`) || row.meta_value;
    const list = variationAttrsTmp.get(row.post_id) || [];
    list.push({ label, value: displayValue });
    variationAttrsTmp.set(row.post_id, list);
  }
  for (const [postId, attrs] of variationAttrsTmp) {
    variationDescription.set(postId, attrs.map((a) => a.value).join(" / "));
  }

  // ---------- Orders ----------
  const [orderRows] = await conn.query<any[]>(
    `SELECT p.ID, p.post_status, p.post_date,
      ${ORDER_META_KEYS.map((k) => `MAX(CASE WHEN pm.meta_key='${k}' THEN pm.meta_value END) AS \`${k}\``).join(",\n      ")}
     FROM nw_posts p
     LEFT JOIN nw_postmeta pm ON pm.post_id = p.ID AND pm.meta_key IN (${ORDER_META_KEYS.map(() => "?").join(",")})
     WHERE p.post_type='shop_order' AND p.post_status != 'trash'
     GROUP BY p.ID`,
    ORDER_META_KEYS
  );
  console.log(`${orderRows.length} pedidos encontrados`);

  const guestCache = new Map<string, string>(); // email -> userId (para pedidos guest recém criados)
  const wcOrderIdToOurId = new Map<number, string>();
  const orderRecords: any[] = [];
  let skippedNoUser = 0;

  for (const o of orderRows) {
    const wcUserId = o._customer_user ? parseInt(o._customer_user, 10) : 0;
    let userId: string | undefined;

    if (wcUserId > 0) {
      const email = wcUserIdToEmail.get(wcUserId);
      userId = email ? emailToUserId.get(email) : undefined;
    }

    if (!userId && o._billing_email) {
      const email = (o._billing_email as string).toLowerCase().trim();
      userId = emailToUserId.get(email) || guestCache.get(email);
      if (!userId) {
        const name = `${o._billing_first_name || ""} ${o._billing_last_name || ""}`.trim() || "Cliente";
        const placeholderPassword = await argon2.hash(randomUUID());
        const guest = await prisma.user.create({
          data: { name, email, password: placeholderPassword, role: "CLIENT" },
        });
        userId = guest.id;
        guestCache.set(email, userId);
        emailToUserId.set(email, userId);
      }
    }

    if (!userId) {
      skippedNoUser++;
      continue;
    }

    const statusInfo = STATUS_MAP[o.post_status] || { status: "PENDING", paymentStatus: "PENDING" };
    const total = parseFloat(o._order_total || "0") || 0;
    const shipping = parseFloat(o._order_shipping || "0") || 0;
    const discount = parseFloat(o._cart_discount || "0") || 0;
    const subtotal = Math.max(0, total - shipping + discount);
    const trackingCode = o.melhorenvio_tracking || o._correios_tracking_code || null;

    const id = randomUUID();
    wcOrderIdToOurId.set(o.ID, id);

    orderRecords.push({
      id,
      orderNumber: String(o.ID),
      userId,
      status: statusInfo.status,
      paymentMethod: mapPaymentMethod(o._payment_method),
      paymentStatus: statusInfo.paymentStatus,
      subtotal,
      shipping,
      discount,
      total,
      trackingCode,
      createdAt: validDate(o._paid_date || o._date_paid || o.post_date),
    });
  }

  console.log(`Inserindo ${orderRecords.length} pedidos (${skippedNoUser} pulados por falta de usuário/email)...`);
  for (const batch of chunk(orderRecords, 2000)) {
    await prisma.order.createMany({ data: batch, skipDuplicates: true });
  }

  // ---------- Order items ----------
  const [itemRows] = await conn.query<any[]>(
    `SELECT oi.order_item_id, oi.order_item_name, oi.order_id,
      MAX(CASE WHEN oim.meta_key='_product_id' THEN oim.meta_value END) AS product_id,
      MAX(CASE WHEN oim.meta_key='_variation_id' THEN oim.meta_value END) AS variation_id,
      MAX(CASE WHEN oim.meta_key='_qty' THEN oim.meta_value END) AS qty,
      MAX(CASE WHEN oim.meta_key='_line_total' THEN oim.meta_value END) AS line_total
     FROM nw_woocommerce_order_items oi
     JOIN nw_woocommerce_order_itemmeta oim ON oim.order_item_id = oi.order_item_id
     WHERE oi.order_item_type = 'line_item'
     GROUP BY oi.order_item_id`
  );
  console.log(`${itemRows.length} itens de pedido encontrados`);

  const itemRecords: any[] = [];
  let itemsSkipped = 0;

  for (const it of itemRows) {
    const orderId = wcOrderIdToOurId.get(it.order_id);
    if (!orderId) { itemsSkipped++; continue; }

    const qty = Math.max(1, Math.round(parseFloat(it.qty || "1")));
    const lineTotal = parseFloat(it.line_total || "0") || 0;
    const price = qty > 0 ? Math.round((lineTotal / qty) * 100) / 100 : lineTotal;

    const variationId = it.variation_id ? parseInt(it.variation_id, 10) : null;
    const productWcId = it.product_id ? parseInt(it.product_id, 10) : null;
    const productSlug = productWcId ? wcIdToSlug.get(productWcId) : undefined;
    const product = productSlug ? slugToProduct.get(productSlug) : undefined;

    itemRecords.push({
      orderId,
      productId: product?.id || null,
      name: it.order_item_name || "Produto",
      price,
      quantity: qty,
      variant: variationId ? variationDescription.get(variationId) || null : null,
      image: product?.images?.[0]?.url || null,
    });
  }

  console.log(`Inserindo ${itemRecords.length} itens (${itemsSkipped} pulados por pedido não encontrado)...`);
  for (const batch of chunk(itemRecords, 2000)) {
    await prisma.orderItem.createMany({ data: batch });
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
