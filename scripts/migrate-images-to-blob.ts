import { createHash } from "crypto";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { put } from "@vercel/blob";
import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

// Migração única: todas as imagens de produto/variante/categoria/item de
// pedido ainda apontam pro WordPress antigo (c7drop.com.br/wp-content/...).
// Quando o DNS for trocado pro Vercel, esse servidor sai do ar e as imagens
// quebram. Esse script baixa cada arquivo (uma vez, mesmo que reutilizado em
// vários lugares), re-hospeda no nosso Blob, e atualiza todas as referências.
const CHECKPOINT_PATH = "/tmp/claude-1000/-home-willian--rea-de-Trabalho-c7drop/3c854225-7d96-4a08-8044-7c70803df932/scratchpad/image-migration-checkpoint.json";
const CONCURRENCY = 15;

function loadCheckpoint(): Record<string, string> {
  if (!existsSync(CHECKPOINT_PATH)) return {};
  try {
    return JSON.parse(readFileSync(CHECKPOINT_PATH, "utf-8"));
  } catch {
    return {};
  }
}

function saveCheckpoint(map: Record<string, string>) {
  writeFileSync(CHECKPOINT_PATH, JSON.stringify(map));
}

function guessContentType(url: string): string {
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase() || "";
  const map: Record<string, string> = {
    jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
    webp: "image/webp", gif: "image/gif", svg: "image/svg+xml", avif: "image/avif",
  };
  return map[ext] || "image/jpeg";
}

async function migrateOne(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.log(`  [pulado ${res.status}] ${url}`);
      return null;
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    const hash = createHash("sha1").update(url).digest("hex").slice(0, 10);
    const originalName = url.split("?")[0].split("/").pop() || "imagem.jpg";
    const blob = await put(`produtos-imagens/${hash}-${originalName}`, buffer, {
      access: "public",
      contentType: res.headers.get("content-type") || guessContentType(url),
    });
    return blob.url;
  } catch (e: any) {
    console.log(`  [erro] ${url} — ${e.message}`);
    return null;
  }
}

// Roda até CONCURRENCY downloads/uploads em paralelo, sem depender de lib externa.
async function runPool<T>(items: T[], worker: (item: T, idx: number) => Promise<void>) {
  let next = 0;
  async function runner() {
    while (next < items.length) {
      const idx = next++;
      await worker(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, runner));
}

async function bulkUpdateUrls(table: string, column: string, mapping: [string, string][]) {
  const BATCH = 500;
  for (let i = 0; i < mapping.length; i += BATCH) {
    const batch = mapping.slice(i, i + BATCH);
    if (batch.length === 0) continue;
    const values = batch.map((_, j) => `($${j * 2 + 1}, $${j * 2 + 2})`).join(",");
    const params = batch.flat();
    await prisma.$executeRawUnsafe(
      `UPDATE "${table}" t SET "${column}" = v.new_url FROM (VALUES ${values}) AS v(old_url, new_url) WHERE t."${column}" = v.old_url`,
      ...params
    );
  }
}

async function main() {
  const rows = await prisma.$queryRaw<{ url: string }[]>`
    SELECT DISTINCT url FROM (
      SELECT url FROM product_images WHERE url LIKE '%c7drop.com.br%'
      UNION
      SELECT image as url FROM product_variants WHERE image LIKE '%c7drop.com.br%'
      UNION
      SELECT image as url FROM order_items WHERE image LIKE '%c7drop.com.br%'
      UNION
      SELECT image as url FROM categories WHERE image LIKE '%c7drop.com.br%'
    ) t
  `;
  const allUrls = rows.map((r) => r.url);
  console.log(`${allUrls.length} URLs únicas encontradas.`);

  const checkpoint = loadCheckpoint();
  const pending = allUrls.filter((u) => !checkpoint[u]);
  console.log(`${allUrls.length - pending.length} já migradas (checkpoint), ${pending.length} restantes.`);

  let done = 0;
  await runPool(pending, async (url) => {
    const newUrl = await migrateOne(url);
    if (newUrl) {
      checkpoint[url] = newUrl;
    }
    done++;
    if (done % 50 === 0) {
      saveCheckpoint(checkpoint);
      console.log(`  ${done}/${pending.length} processadas...`);
    }
  });
  saveCheckpoint(checkpoint);

  const migratedCount = Object.keys(checkpoint).length;
  console.log(`Download/upload concluído: ${migratedCount}/${allUrls.length} migradas com sucesso.`);

  const mapping = Object.entries(checkpoint) as [string, string][];
  console.log("Atualizando banco de dados...");
  await bulkUpdateUrls("product_images", "url", mapping);
  await bulkUpdateUrls("product_variants", "image", mapping);
  await bulkUpdateUrls("order_items", "image", mapping);
  await bulkUpdateUrls("categories", "image", mapping);

  console.log("Concluído.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
