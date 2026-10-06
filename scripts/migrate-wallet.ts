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

  // Saldo atual = balance da transação mais recente (maior transaction_id) de cada usuário
  const [rows] = await conn.query<any[]>(
    `SELECT t.user_id, t.balance FROM nw_woo_wallet_transactions t
     JOIN (
       SELECT user_id, MAX(transaction_id) AS max_id FROM nw_woo_wallet_transactions
       WHERE deleted = 0
       GROUP BY user_id
     ) latest ON latest.user_id = t.user_id AND latest.max_id = t.transaction_id`
  );
  console.log(`${rows.length} saldos de wallet encontrados`);

  const [wcUserRows] = await conn.query<any[]>(`SELECT ID, user_email FROM nw_users`);
  const wcUserIdToEmail = new Map<number, string>(wcUserRows.map((r) => [r.ID, r.user_email.toLowerCase().trim()]));
  await conn.end();

  const ourUsers = await prisma.user.findMany({ select: { id: true, email: true } });
  const emailToUserId = new Map(ourUsers.map((u) => [u.email.toLowerCase().trim(), u.id]));

  let updated = 0;
  let skipped = 0;
  const updates: { id: string; cashback: number }[] = [];

  for (const r of rows) {
    const email = wcUserIdToEmail.get(r.user_id);
    const userId = email ? emailToUserId.get(email) : undefined;
    if (!userId) { skipped++; continue; }
    const cashback = Math.max(0, parseFloat(r.balance) || 0);
    if (cashback <= 0) continue;
    updates.push({ id: userId, cashback });
  }

  console.log(`Atualizando saldo de ${updates.length} usuários (${skipped} sem correspondência)...`);
  for (const batch of chunk(updates, 200)) {
    await Promise.all(
      batch.map((u) => prisma.user.update({ where: { id: u.id }, data: { cashback: u.cashback } }))
    );
    updated += batch.length;
    console.log(`${updated}/${updates.length}...`);
  }

  console.log("Concluído.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
