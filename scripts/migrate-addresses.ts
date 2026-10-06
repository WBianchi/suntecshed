import mysql from "mysql2/promise";
import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

const KEYS = [
  "billing_address_1", "billing_address_2", "billing_number", "billing_neighborhood",
  "billing_city", "billing_state", "billing_postcode", "billing_phone", "billing_cellphone",
  "billing_first_name", "billing_last_name", "first_name", "last_name",
  "shipping_address_1", "shipping_number", "shipping_neighborhood",
  "shipping_city", "shipping_state", "shipping_postcode",
  "shipping_first_name", "shipping_last_name",
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
    `SELECT u.ID, u.user_email,
      ${KEYS.map((k) => `MAX(CASE WHEN um.meta_key='${k}' THEN um.meta_value END) AS ${k}`).join(",\n      ")}
    FROM nw_users u
    LEFT JOIN nw_usermeta um ON um.user_id = u.ID AND um.meta_key IN (${KEYS.map(() => "?").join(",")})
    GROUP BY u.ID`,
    KEYS
  );
  await conn.end();
  console.log(`Lidos ${rows.length} usuários do WooCommerce`);

  const existingUsers = await prisma.user.findMany({ select: { id: true, email: true } });
  const emailToId = new Map(existingUsers.map((u) => [u.email.toLowerCase().trim(), u.id]));
  console.log(`${emailToId.size} usuários existentes no Postgres`);

  const existingAddressCount = await prisma.address.count();
  if (existingAddressCount > 0) {
    console.log(`Já existem ${existingAddressCount} endereços, abortando para evitar duplicar.`);
    await prisma.$disconnect();
    return;
  }

  const addressRecords: any[] = [];

  for (const u of rows) {
    const userId = emailToId.get(u.user_email.toLowerCase().trim());
    if (!userId) continue;

    const firstName = u.billing_first_name || u.first_name || "";
    const lastName = u.billing_last_name || u.last_name || "";
    const name = `${firstName} ${lastName}`.trim();
    const phone = u.billing_cellphone || u.billing_phone || null;

    if (u.billing_address_1 && u.billing_city && u.billing_state) {
      addressRecords.push({
        userId,
        label: "Principal",
        name: name || "Cliente",
        phone,
        street: u.billing_address_1,
        number: u.billing_number || "S/N",
        complement: u.billing_address_2 || null,
        neighborhood: u.billing_neighborhood || "",
        city: u.billing_city,
        state: u.billing_state,
        zipCode: u.billing_postcode || "",
        country: "Brasil",
        isDefault: true,
      });
    }

    if (
      u.shipping_address_1 &&
      u.shipping_city &&
      u.shipping_state &&
      u.shipping_address_1 !== u.billing_address_1
    ) {
      const shipName = `${u.shipping_first_name || ""} ${u.shipping_last_name || ""}`.trim() || name || "Cliente";
      addressRecords.push({
        userId,
        label: "Entrega",
        name: shipName,
        phone,
        street: u.shipping_address_1,
        number: u.shipping_number || "S/N",
        complement: null,
        neighborhood: u.shipping_neighborhood || "",
        city: u.shipping_city,
        state: u.shipping_state,
        zipCode: u.shipping_postcode || "",
        country: "Brasil",
        isDefault: false,
      });
    }
  }

  console.log(`Inserindo ${addressRecords.length} endereços...`);
  for (const batch of chunk(addressRecords, 2000)) {
    await prisma.address.createMany({ data: batch });
  }
  console.log("Concluído.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
