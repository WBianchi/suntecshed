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
    `SELECT transaction_id, user_id, type, amount, balance, details, date
     FROM nw_woo_wallet_transactions
     WHERE deleted = 0
     ORDER BY transaction_id ASC`
  );
  console.log(`${rows.length} transações de wallet encontradas na origem`);

  const [wcUserRows] = await conn.query<any[]>(`SELECT ID, user_email FROM nw_users`);
  const wcUserIdToEmail = new Map<number, string>(wcUserRows.map((r) => [r.ID, r.user_email.toLowerCase().trim()]));
  await conn.end();

  const ourUsers = await prisma.user.findMany({ select: { id: true, email: true } });
  const emailToUserId = new Map(ourUsers.map((u) => [u.email.toLowerCase().trim(), u.id]));

  const toCreate: {
    userId: string;
    type: "CREDIT" | "DEBIT";
    amount: number;
    balanceAfter: number;
    source: "MIGRATION";
    description: string | null;
    createdAt: Date;
  }[] = [];

  let skipped = 0;
  for (const r of rows) {
    const email = wcUserIdToEmail.get(r.user_id);
    const userId = email ? emailToUserId.get(email) : undefined;
    if (!userId) { skipped++; continue; }

    toCreate.push({
      userId,
      type: r.type === "credit" ? "CREDIT" : "DEBIT",
      amount: Math.abs(parseFloat(r.amount) || 0),
      balanceAfter: Math.max(0, parseFloat(r.balance) || 0),
      source: "MIGRATION",
      description: r.details || null,
      createdAt: new Date(r.date),
    });
  }

  console.log(`Importando ${toCreate.length} transações (${skipped} sem usuário correspondente)...`);

  let created = 0;
  for (const batch of chunk(toCreate, 1000)) {
    await prisma.walletTransaction.createMany({ data: batch });
    created += batch.length;
    console.log(`${created}/${toCreate.length}...`);
  }

  console.log("Concluído.");
  const total = await prisma.walletTransaction.count();
  console.log("total de wallet_transactions agora:", total);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
