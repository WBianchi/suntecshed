import { randomUUID } from "crypto";
import argon2 from "argon2";
import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

const WC_BASE = "https://c7drop.com.br/wp-json/wc/v3";
const WC_AUTH = "Basic " + Buffer.from(
  `${process.env.WC_CONSUMER_KEY}:${process.env.WC_CONSUMER_SECRET}`
).toString("base64");

async function wcFetch<T = any>(path: string): Promise<T> {
  const res = await fetch(`${WC_BASE}${path}`, { headers: { Authorization: WC_AUTH } });
  if (!res.ok) throw new Error(`WooCommerce API ${path} -> ${res.status}`);
  return res.json();
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const TIER_BY_SLUG: Record<string, "DROPSHIPPING" | "ATACADO" | "GRUPO_VIP"> = {
  dropshipping: "DROPSHIPPING",
  atacado: "ATACADO",
  "grupo-vip": "GRUPO_VIP",
};

const STATUS_MAP: Record<string, { status: string; paymentStatus: string }> = {
  pending: { status: "PENDING", paymentStatus: "PENDING" },
  processing: { status: "PAYMENT_CONFIRMED", paymentStatus: "CONFIRMED" },
  "pagamento-aprova": { status: "PAYMENT_CONFIRMED", paymentStatus: "CONFIRMED" },
  "pedido-enviado": { status: "SHIPPED", paymentStatus: "CONFIRMED" },
  "on-hold": { status: "AWAITING_PAYMENT", paymentStatus: "PENDING" },
  cancelled: { status: "CANCELLED", paymentStatus: "CANCELLED" },
  refunded: { status: "REFUNDED", paymentStatus: "REFUNDED" },
  failed: { status: "CANCELLED", paymentStatus: "FAILED" },
  "ausencia-da-etiqu": { status: "MISSING_LABEL", paymentStatus: "CONFIRMED" },
  "erro-no-pedido": { status: "ORDER_ERROR", paymentStatus: "FAILED" },
  completed: { status: "DELIVERED", paymentStatus: "CONFIRMED" },
};

function mapPaymentMethod(raw: string | null): string | null {
  if (!raw) return null;
  const v = raw.toLowerCase();
  if (v.includes("pix")) return "PIX";
  if (v.includes("boleto") || v.includes("billet")) return "BOLETO";
  if (v.includes("credit")) return "CREDIT_CARD";
  return null;
}

function metaValue(metaData: { key: string; value: any }[], key: string): string | null {
  return metaData.find((m) => m.key === key)?.value || null;
}

async function syncNewProducts() {
  const ourProducts = await prisma.product.findMany({ select: { slug: true } });
  const ourSlugs = new Set(ourProducts.map((p) => p.slug));
  const ourCategories = await prisma.category.findMany({ select: { id: true, slug: true } });
  const categoryBySlug = new Map(ourCategories.map((c) => [c.slug, c.id]));

  let page = 1;
  const wcProducts: any[] = [];
  while (true) {
    const data = await wcFetch<any[]>(`/products?per_page=100&page=${page}&status=publish`);
    if (!Array.isArray(data) || data.length === 0) break;
    wcProducts.push(...data);
    if (data.length < 100) break;
    page++;
  }

  const missing = wcProducts.filter((p) => !ourSlugs.has(p.slug));
  console.log(`${missing.length} produtos novos encontrados no WooCommerce.`);

  for (const p of missing) {
    const price = parseFloat(p.sale_price || p.price || "0") || 0;
    const regular = parseFloat(p.regular_price || "0") || 0;
    const compareAtPrice = regular && regular > price ? regular : null;

    const product = await prisma.product.upsert({
      where: { slug: p.slug || slugify(p.name) },
      update: {},
      create: {
        name: p.name,
        slug: p.slug || slugify(p.name),
        description: p.description || null,
        shortDescription: p.short_description || null,
        sku: p.sku || null,
        price,
        compareAtPrice,
        weight: p.weight ? parseFloat(p.weight) : null,
        width: p.dimensions?.width ? parseFloat(p.dimensions.width) : null,
        height: p.dimensions?.height ? parseFloat(p.dimensions.height) : null,
        length: p.dimensions?.length ? parseFloat(p.dimensions.length) : null,
        stock: p.stock_quantity ? Math.max(0, Math.round(p.stock_quantity)) : 0,
        manageStock: !!p.manage_stock,
        active: true,
      },
    });

    if (Array.isArray(p.images) && p.images.length > 0) {
      await prisma.productImage.createMany({
        data: p.images.map((img: any, idx: number) => ({
          productId: product.id,
          url: img.src,
          isPrimary: idx === 0,
          order: idx,
        })),
      });
    }

    for (const cat of p.categories || []) {
      let categoryId = categoryBySlug.get(cat.slug);
      if (!categoryId) {
        const created = await prisma.category.upsert({
          where: { slug: cat.slug },
          update: {},
          create: { name: cat.name, slug: cat.slug, order: 0 },
        });
        categoryId = created.id;
        categoryBySlug.set(cat.slug, categoryId);
      }
      await prisma.productCategory.createMany({
        data: [{ productId: product.id, categoryId }],
        skipDuplicates: true,
      });
    }

    if (p.type === "variable") {
      const variations = await wcFetch<any[]>(`/products/${p.id}/variations?per_page=100`);
      const variantRecords = variations.map((v) => {
        const compraAttr = v.attributes?.find((a: any) => a.slug === "pa_compra" || a.name === "Compra");
        const otherAttrs = (v.attributes || []).filter((a: any) => a !== compraAttr);
        const tier = compraAttr ? TIER_BY_SLUG[slugify(compraAttr.option)] : undefined;

        let name: string;
        let value: string;
        if (otherAttrs.length === 0) {
          name = "Compra";
          value = compraAttr?.option || "Padrão";
        } else if (otherAttrs.length === 1) {
          name = otherAttrs[0].name;
          value = otherAttrs[0].option;
        } else {
          name = "Variação";
          value = otherAttrs.map((a: any) => a.option).join(" / ");
        }

        return {
          productId: product.id,
          name,
          value,
          tier: tier || null,
          price: v.price ? parseFloat(v.price) : null,
          stock: v.stock_quantity ? Math.max(0, Math.round(v.stock_quantity)) : 0,
          sku: v.sku || p.sku || null,
          image: v.image?.src || null,
        };
      });
      if (variantRecords.length > 0) {
        await prisma.productVariant.createMany({ data: variantRecords });
      }
    }

    console.log(`Produto importado: ${p.name} (${p.sku || "sem sku"})`);
  }
}

async function syncNewOrders() {
  const maxOrderRow = await prisma.$queryRaw<{ max: number }[]>`
    SELECT MAX(CAST("orderNumber" AS INTEGER)) as max FROM orders WHERE "orderNumber" ~ '^[0-9]+$'
  `;
  const maxOrderNumber = maxOrderRow[0]?.max || 0;
  console.log(`Maior número de pedido já importado: ${maxOrderNumber}`);

  let page = 1;
  const newOrders: any[] = [];
  while (true) {
    const data = await wcFetch<any[]>(`/orders?per_page=100&orderby=date&order=desc&page=${page}`);
    if (!Array.isArray(data) || data.length === 0) break;
    let allBelow = true;
    for (const o of data) {
      if (o.id > maxOrderNumber) { newOrders.push(o); allBelow = false; }
    }
    if (allBelow) break;
    page++;
    if (page > 10) break;
  }
  console.log(`${newOrders.length} pedidos novos encontrados no WooCommerce.`);
  if (newOrders.length === 0) return;

  const ourUsers = await prisma.user.findMany({ select: { id: true, email: true } });
  const emailToUserId = new Map(ourUsers.map((u) => [u.email.toLowerCase().trim(), u.id]));

  const ourProducts = await prisma.product.findMany({ select: { id: true, sku: true, slug: true } });
  const skuToProduct = new Map(ourProducts.filter((p) => p.sku).map((p) => [p.sku as string, p]));

  const guestCache = new Map<string, string>();

  for (const o of newOrders) {
    const email = (o.billing?.email || "").toLowerCase().trim();
    let userId = email ? emailToUserId.get(email) || guestCache.get(email) : undefined;

    if (!userId && email) {
      const name = `${o.billing?.first_name || ""} ${o.billing?.last_name || ""}`.trim() || "Cliente";
      const placeholderPassword = await argon2.hash(randomUUID());
      const guest = await prisma.user.create({
        data: { name, email, password: placeholderPassword, role: "CLIENT" },
      });
      userId = guest.id;
      guestCache.set(email, userId);
      emailToUserId.set(email, userId);
    }

    if (!userId) {
      console.log(`Pedido ${o.number} pulado — sem e-mail de cobrança.`);
      continue;
    }

    const statusInfo = STATUS_MAP[o.status] || { status: "PENDING", paymentStatus: "PENDING" };
    const total = parseFloat(o.total || "0") || 0;
    const shipping = parseFloat(o.shipping_total || "0") || 0;
    const discount = parseFloat(o.discount_total || "0") || 0;
    const subtotal = Math.max(0, total - shipping + discount);

    const document = (o.billing?.cnpj || o.billing?.cpf || "").replace(/\D/g, "") || null;
    const labelUrl = metaValue(o.meta_data || [], "_shipping_label_url");
    const trackingCode =
      metaValue(o.meta_data || [], "melhorenvio_tracking") ||
      metaValue(o.meta_data || [], "_correios_tracking_code");

    const shippingSnapshot = {
      street: o.shipping?.address_1 || o.billing?.address_1 || "",
      number: o.shipping?.number || o.billing?.number || "",
      complement: o.shipping?.address_2 || o.billing?.address_2 || "",
      neighborhood: o.shipping?.neighborhood || o.billing?.neighborhood || "",
      city: o.shipping?.city || o.billing?.city || "",
      state: o.shipping?.state || o.billing?.state || "",
      zipCode: o.shipping?.postcode || o.billing?.postcode || "",
      phone: o.billing?.phone || "",
      document,
    };

    const order = await prisma.order.create({
      data: {
        orderNumber: String(o.id),
        userId,
        status: statusInfo.status as any,
        paymentMethod: mapPaymentMethod(o.payment_method) as any,
        paymentStatus: statusInfo.paymentStatus as any,
        subtotal,
        shipping,
        discount,
        total,
        trackingCode,
        shippingSnapshot,
        legacyStatus: o.status,
        recipientName: `${o.billing?.first_name || ""} ${o.billing?.last_name || ""}`.trim() || null,
        recipientDocument: document,
        labelUrl,
        createdAt: new Date(o.date_paid || o.date_created),
      },
    });

    const itemRecords = (o.line_items || []).map((it: any) => {
      const product = it.sku ? skuToProduct.get(it.sku) : undefined;
      const attrs = (it.meta_data || [])
        .filter((m: any) => m.display_value && m.key !== "pa_compra")
        .map((m: any) => m.display_value);
      return {
        orderId: order.id,
        productId: product?.id || null,
        name: it.name || "Produto",
        price: it.quantity > 0 ? Math.round((parseFloat(it.total) / it.quantity) * 100) / 100 : parseFloat(it.total) || 0,
        quantity: Math.max(1, Math.round(it.quantity || 1)),
        variant: attrs.length > 0 ? attrs.join(" / ") : null,
        image: it.image?.src || null,
      };
    });

    if (itemRecords.length > 0) {
      await prisma.orderItem.createMany({ data: itemRecords });
    }

    console.log(`Pedido importado: ${o.number} (${statusInfo.status})`);
  }
}

async function main() {
  await syncNewProducts();
  await syncNewOrders();
  console.log("Sincronização concluída.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
