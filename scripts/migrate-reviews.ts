import mysql from "mysql2/promise";
import { randomUUID } from "crypto";
import argon2 from "argon2";
import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

function validDate(raw: string | Date | null): Date {
  if (!raw) return new Date();
  const d = raw instanceof Date ? raw : new Date(String(raw).replace(" ", "T") + "Z");
  if (isNaN(d.getTime()) || d.getFullYear() < 1971) return new Date();
  return d;
}

async function main() {
  const existing = await prisma.review.count();
  if (existing > 0) {
    console.log(`Já existem ${existing} avaliações, abortando para evitar duplicar.`);
    return;
  }

  const conn = await mysql.createConnection({
    host: "127.0.0.1", port: 33066, user: "root", password: "rootpass", database: "c7dr_site",
  });

  const [rows] = await conn.query<any[]>(
    `SELECT c.comment_ID, c.comment_post_ID, c.user_id, c.comment_author, c.comment_author_email,
      c.comment_content, c.comment_date,
      MAX(CASE WHEN cm.meta_key='rating' THEN cm.meta_value END) AS rating
     FROM nw_comments c
     JOIN nw_commentmeta cm ON cm.comment_id = c.comment_ID
     WHERE c.comment_type='review' AND c.comment_approved NOT IN ('spam','post-trashed')
     GROUP BY c.comment_ID
     HAVING rating IS NOT NULL`
  );
  console.log(`${rows.length} avaliações com nota encontradas`);

  const [wcUserRows] = await conn.query<any[]>(`SELECT ID, user_email FROM nw_users`);
  const wcUserIdToEmail = new Map<number, string>(wcUserRows.map((r) => [r.ID, r.user_email.toLowerCase().trim()]));

  const [wcProductRows] = await conn.query<any[]>(
    `SELECT ID, post_name FROM nw_posts WHERE post_type='product'`
  );
  const wcIdToSlug = new Map<number, string>(wcProductRows.map((r) => [r.ID, r.post_name]));

  await conn.end();

  const ourUsers = await prisma.user.findMany({ select: { id: true, email: true } });
  const emailToUserId = new Map(ourUsers.map((u) => [u.email.toLowerCase().trim(), u.id]));

  const ourProducts = await prisma.product.findMany({ select: { id: true, slug: true } });
  const slugToProductId = new Map(ourProducts.map((p) => [p.slug, p.id]));

  const guestCache = new Map<string, string>();
  const reviewRecords: any[] = [];
  let skipped = 0;

  for (const r of rows) {
    const productSlug = wcIdToSlug.get(r.comment_post_ID);
    const productId = productSlug ? slugToProductId.get(productSlug) : undefined;
    if (!productId) { skipped++; continue; }

    let userId: string | undefined;
    if (r.user_id > 0) {
      const email = wcUserIdToEmail.get(r.user_id);
      userId = email ? emailToUserId.get(email) : undefined;
    }
    if (!userId && r.comment_author_email) {
      const email = (r.comment_author_email as string).toLowerCase().trim();
      userId = emailToUserId.get(email) || guestCache.get(email);
      if (!userId) {
        const placeholderPassword = await argon2.hash(randomUUID());
        const guest = await prisma.user.create({
          data: { name: r.comment_author || "Cliente", email, password: placeholderPassword, role: "CLIENT" },
        });
        userId = guest.id;
        guestCache.set(email, userId);
        emailToUserId.set(email, userId);
      }
    }
    if (!userId) { skipped++; continue; }

    const rating = Math.min(5, Math.max(1, Math.round(parseFloat(r.rating))));

    reviewRecords.push({
      productId,
      userId,
      rating,
      comment: r.comment_content || null,
      approved: true,
      createdAt: validDate(r.comment_date),
    });
  }

  console.log(`Inserindo ${reviewRecords.length} avaliações (${skipped} puladas)...`);
  await prisma.review.createMany({ data: reviewRecords });

  console.log("Concluído.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
