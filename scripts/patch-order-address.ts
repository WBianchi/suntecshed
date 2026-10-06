import mysql from "mysql2/promise";
import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

const KEYS = [
  "_billing_first_name", "_billing_last_name", "_billing_cpf", "_billing_cnpj",
  "_billing_address_1", "_billing_address_2", "_billing_number", "_billing_neighborhood",
  "_billing_city", "_billing_state", "_billing_postcode",
  "_shipping_first_name", "_shipping_last_name", "_shipping_address_1", "_shipping_number",
  "_shipping_neighborhood", "_shipping_city", "_shipping_state", "_shipping_postcode",
];

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function main() {
  const conn = await mysql.createConnection({
    host: "127.0.0.1", port: 33066, user: "root", password: "rootpass", database: "c7dr_site",
  });

  const [rows] = await conn.query<any[]>(
    `SELECT p.ID, p.post_status,
      ${KEYS.map((k) => `MAX(CASE WHEN pm.meta_key='${k}' THEN pm.meta_value END) AS \`${k}\``).join(",\n      ")}
     FROM nw_posts p
     LEFT JOIN nw_postmeta pm ON pm.post_id = p.ID AND pm.meta_key IN (${KEYS.map(() => "?").join(",")})
     WHERE p.post_type='shop_order' AND p.post_status != 'trash'
     GROUP BY p.ID`,
    KEYS
  );
  await conn.end();
  console.log(`${rows.length} pedidos lidos da origem`);

  let updated = 0;
  for (const batch of chunk(rows, 100)) {
    await Promise.all(
      batch.map((o) => {
        const useShipping = !!o._shipping_address_1;
        const street = useShipping ? o._shipping_address_1 : o._billing_address_1;
        const number = useShipping ? o._shipping_number : o._billing_number;
        const neighborhood = useShipping ? o._shipping_neighborhood : o._billing_neighborhood;
        const city = useShipping ? o._shipping_city : o._billing_city;
        const state = useShipping ? o._shipping_state : o._billing_state;
        const zipCode = useShipping ? o._shipping_postcode : o._billing_postcode;
        const name = useShipping
          ? `${o._shipping_first_name || ""} ${o._shipping_last_name || ""}`.trim()
          : `${o._billing_first_name || ""} ${o._billing_last_name || ""}`.trim();

        const snapshot = street
          ? {
              name: name || null,
              cpf: o._billing_cpf || null,
              cnpj: o._billing_cnpj || null,
              street,
              number: number || "S/N",
              complement: o._billing_address_2 || null,
              neighborhood: neighborhood || null,
              city: city || null,
              state: state || null,
              zipCode: zipCode || null,
            }
          : undefined;

        return prisma.order.updateMany({
          where: { orderNumber: String(o.ID) },
          data: {
            legacyStatus: o.post_status,
            ...(snapshot ? { shippingSnapshot: snapshot } : {}),
          },
        });
      })
    );
    updated += batch.length;
    console.log(`${updated}/${rows.length}...`);
  }

  console.log("Concluído.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
