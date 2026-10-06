import mysql from "mysql2/promise";
import { randomUUID } from "crypto";
import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

const BILLING_SHIPPING_KEYS = [
  "billing_first_name", "billing_last_name", "first_name", "last_name",
  "billing_phone", "billing_cellphone", "billing_cpf", "billing_cnpj",
  "billing_address_1", "billing_address_2", "billing_number", "billing_neighborhood",
  "billing_city", "billing_state", "billing_postcode",
  "shipping_address_1", "shipping_number", "shipping_neighborhood",
  "shipping_city", "shipping_state", "shipping_postcode",
  "shipping_first_name", "shipping_last_name",
  "nw_capabilities",
];

interface WooUserRow {
  ID: number;
  user_login: string;
  user_email: string;
  user_pass: string;
  user_registered: string;
  display_name: string;
  billing_first_name: string | null;
  billing_last_name: string | null;
  first_name: string | null;
  last_name: string | null;
  billing_phone: string | null;
  billing_cellphone: string | null;
  billing_cpf: string | null;
  billing_cnpj: string | null;
  billing_address_1: string | null;
  billing_address_2: string | null;
  billing_number: string | null;
  billing_neighborhood: string | null;
  billing_city: string | null;
  billing_state: string | null;
  billing_postcode: string | null;
  shipping_address_1: string | null;
  shipping_number: string | null;
  shipping_neighborhood: string | null;
  shipping_city: string | null;
  shipping_state: string | null;
  shipping_postcode: string | null;
  shipping_first_name: string | null;
  shipping_last_name: string | null;
  nw_capabilities: string | null;
}

function validDate(raw: string | Date | null): Date {
  if (!raw) return new Date();
  const d = raw instanceof Date ? raw : new Date(raw.replace(" ", "T") + "Z");
  if (isNaN(d.getTime()) || d.getFullYear() < 1971) return new Date();
  return d;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function main() {
  const conn = await mysql.createConnection({
    host: "127.0.0.1",
    port: 33066,
    user: "root",
    password: "rootpass",
    database: "c7dr_site",
  });

  const placeholders = BILLING_SHIPPING_KEYS.map(() => "?").join(",");
  const [rows] = await conn.query<any[]>(
    `SELECT u.ID, u.user_login, u.user_email, u.user_pass, u.user_registered, u.display_name,
      ${BILLING_SHIPPING_KEYS.map((k) => `MAX(CASE WHEN um.meta_key='${k}' THEN um.meta_value END) AS ${k}`).join(",\n      ")}
    FROM nw_users u
    LEFT JOIN nw_usermeta um ON um.user_id = u.ID AND um.meta_key IN (${placeholders})
    GROUP BY u.ID`,
    BILLING_SHIPPING_KEYS
  );
  const wooUsers = rows as WooUserRow[];
  console.log(`Lidos ${wooUsers.length} usuários do WooCommerce`);

  const nonAdmin = wooUsers.filter((u) => !u.nw_capabilities || !u.nw_capabilities.includes("administrator"));
  console.log(`${nonAdmin.length} não-administradores a importar`);

  const userRecords: any[] = [];
  const addressRecords: any[] = [];

  for (const u of nonAdmin) {
    const id = randomUUID();
    const firstName = u.billing_first_name || u.first_name || "";
    const lastName = u.billing_last_name || u.last_name || "";
    const name = `${firstName} ${lastName}`.trim() || u.display_name || u.user_login;
    const phone = u.billing_cellphone || u.billing_phone || null;

    userRecords.push({
      id,
      role: "CLIENT" as const,
      name,
      email: u.user_email.toLowerCase().trim(),
      password: u.user_pass,
      phone,
      cpf: u.billing_cpf || null,
      cnpj: u.billing_cnpj || null,
      street: u.billing_address_1 || null,
      number: u.billing_number || null,
      complement: u.billing_address_2 || null,
      neighborhood: u.billing_neighborhood || null,
      city: u.billing_city || null,
      state: u.billing_state || null,
      zipCode: u.billing_postcode || null,
      country: "Brasil",
      createdAt: validDate(u.user_registered),
    });

    if (u.billing_address_1 && u.billing_city && u.billing_state) {
      addressRecords.push({
        userId: id,
        label: "Principal",
        name,
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
      const shipName = `${u.shipping_first_name || ""} ${u.shipping_last_name || ""}`.trim() || name;
      addressRecords.push({
        userId: id,
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

  console.log(`Inserindo ${userRecords.length} usuários...`);
  for (const batch of chunk(userRecords, 2000)) {
    await prisma.user.createMany({ data: batch, skipDuplicates: true });
  }

  console.log(`Inserindo ${addressRecords.length} endereços...`);
  for (const batch of chunk(addressRecords, 2000)) {
    await prisma.address.createMany({ data: batch });
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
