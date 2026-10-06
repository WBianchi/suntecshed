import mysql from "mysql2/promise";
import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

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
    `SELECT p.ID, pm.meta_value AS label_url
     FROM nw_posts p
     JOIN nw_postmeta pm ON pm.post_id = p.ID AND pm.meta_key = '_shipping_label_url'
     WHERE p.post_type='shop_order' AND p.post_status != 'trash'`
  );
  await conn.end();
  console.log(`${rows.length} pedidos com etiqueta encontrados na origem`);

  let updated = 0;
  for (const batch of chunk(rows, 200)) {
    await Promise.all(
      batch.map((r) =>
        prisma.order.updateMany({
          where: { orderNumber: String(r.ID) },
          data: { labelUrl: r.label_url },
        })
      )
    );
    updated += batch.length;
    if (updated % 2000 === 0) console.log(`${updated}/${rows.length}...`);
  }

  console.log("Concluído.");
  const withLabel = await prisma.order.count({ where: { labelUrl: { not: null } } });
  console.log("pedidos com labelUrl agora:", withLabel);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
