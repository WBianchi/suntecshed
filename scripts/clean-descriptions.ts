import mysql from "mysql2/promise";
import * as cheerio from "cheerio";
import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

// Seletores que identificam blocos de specs "colados" do Mercado Livre — removidos por inteiro.
const ML_JUNK_SELECTORS = [
  ".ui-pdp-container__row--highlighted-specs-title",
  ".ui-vpp-highlighted-specs",
  ".ui-pdp-container__row--attributes",
  ".ui-vpp-striped-specs",
  ".ui-pdp-collapsable",
  ".ui-pdp-container__row--technical-specifications",
];

function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface SpecGroup {
  title: string;
  rows: { label: string; value: string }[];
}

function extractSpecs($: cheerio.CheerioAPI): SpecGroup[] {
  const groups: SpecGroup[] = [];
  $(".ui-vpp-striped-specs__table").each((_, table) => {
    const $table = $(table);
    const title = $table.find(".ui-vpp-striped-specs__header").first().text().trim() || "Especificações";
    const rows: { label: string; value: string }[] = [];
    $table.find("tr").each((_, tr) => {
      const $tr = $(tr);
      const label = $tr.find("th").first().text().trim();
      const value = $tr.find("td .andes-table__column--value").first().text().trim()
        || $tr.find("td").first().text().trim();
      if (label && value) rows.push({ label, value });
    });
    if (rows.length > 0) groups.push({ title, rows });
  });
  return groups;
}

function stripAttributes($: cheerio.CheerioAPI, root: cheerio.Cheerio<any>) {
  root.find("*").addBack().each((_, el) => {
    if (el.type !== "tag") return;
    const attribs = { ...(el as any).attribs };
    for (const attr of Object.keys(attribs)) {
      $(el).removeAttr(attr);
    }
  });
}

function removeEmptyNodes($: cheerio.CheerioAPI, root: cheerio.Cheerio<any>) {
  let changed = true;
  while (changed) {
    changed = false;
    root.find("div, span, p").each((_, el) => {
      const $el = $(el);
      if ($el.text().trim() === "" && $el.find("img").length === 0) {
        $el.remove();
        changed = true;
      }
    });
  }
}

function cleanHtml(raw: string): { prose: string; specs: SpecGroup[] } {
  const $ = cheerio.load(`<div id="__root">${raw}</div>`);
  const root = $("#__root");
  const specs = extractSpecs($);
  root.find(ML_JUNK_SELECTORS.join(",")).remove();
  stripAttributes($, root);
  removeEmptyNodes($, root);
  const prose = root.html()?.trim() || "";
  return { prose, specs };
}

function specsToHtml(groups: SpecGroup[]): string {
  return groups
    .map((g) => {
      const items = g.rows.map((r) => `<li><strong>${r.label}:</strong> ${r.value}</li>`).join("");
      return `<h4>${g.title}</h4><ul>${items}</ul>`;
    })
    .join("");
}

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
    `SELECT ID, post_name, post_content, post_excerpt FROM nw_posts
     WHERE post_type='product' AND post_status='publish'`
  );
  await conn.end();
  console.log(`${rows.length} produtos lidos da origem`);

  const brandCache = new Map<string, string>(); // name(lowercase) -> brandId
  const existingBrands = await prisma.brand.findMany();
  for (const b of existingBrands) brandCache.set(b.name.toLowerCase(), b.id);

  let updated = 0;
  let withSpecsExtracted = 0;
  let withBrandSet = 0;

  for (const batch of chunk(rows, 200)) {
    for (const row of batch) {
      const slug = row.post_name;
      if (!slug) continue;

      const product = await prisma.product.findUnique({ where: { slug } });
      if (!product) continue;

      const { prose, specs } = cleanHtml(row.post_content || "");
      const { prose: cleanExcerpt } = cleanHtml(row.post_excerpt || "");

      const marcaRow = specs.flatMap((g) => g.rows).find((r) => r.label.toLowerCase() === "marca");
      const linhaRow = specs.flatMap((g) => g.rows).find((r) => r.label.toLowerCase() === "linha");

      const finalDescription = [prose, specsToHtml(specs)].filter(Boolean).join("\n");

      const data: any = {
        description: finalDescription || null,
        shortDescription: cleanExcerpt || null,
      };

      if (linhaRow && !product.linha) {
        data.linha = linhaRow.value;
      }

      if (marcaRow && !product.brandId) {
        const brandName = marcaRow.value.trim();
        const key = brandName.toLowerCase();
        let brandId = brandCache.get(key);
        if (!brandId) {
          const brand = await prisma.brand.upsert({
            where: { slug: slugify(brandName) },
            update: {},
            create: { name: brandName, slug: slugify(brandName) },
          });
          brandId = brand.id;
          brandCache.set(key, brandId);
        }
        data.brandId = brandId;
        withBrandSet++;
      }

      if (specs.length > 0) withSpecsExtracted++;

      await prisma.product.update({ where: { id: product.id }, data });
      updated++;
    }
    console.log(`${updated}/${rows.length} processados...`);
  }

  console.log(`Concluído. ${updated} produtos atualizados, ${withSpecsExtracted} com specs extraídas, ${withBrandSet} com marca vinculada.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
