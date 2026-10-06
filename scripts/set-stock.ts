/**
 * Deixa todo produto com estoque positivo (os importados do c7drop vinham com
 * stock negativo — oversold do banco antigo — e por isso apareciam sem estoque).
 *
 * Uso:
 *   npx tsx scripts/set-stock.ts [minimo] [maximo]   # padrão 20 e 120
 *
 * Só mexe em produto com stock <= 0; quem já tem estoque fica como está.
 * As variantes ficam com stock 0 de propósito: o app usa
 * `variante.stock > 0 ? variante.stock : produto.stock`, então 0 cai no
 * estoque base do produto (um número só pra controlar).
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

function inteiro(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  const min = Number(process.argv[2] ?? 20);
  const max = Number(process.argv[3] ?? 120);

  const semEstoque = await prisma.product.findMany({
    where: { stock: { lte: 0 } },
    select: { id: true, name: true, stock: true },
    orderBy: { name: "asc" },
  });

  if (semEstoque.length === 0) {
    console.log("nada a fazer: nenhum produto com estoque <= 0");
    return;
  }

  for (const produto of semEstoque) {
    const novo = inteiro(min, max);
    await prisma.product.update({ where: { id: produto.id }, data: { stock: novo } });
    console.log(`  ${produto.stock} -> ${novo}  ${produto.name.slice(0, 60)}`);
  }

  const restantes = await prisma.product.count({ where: { stock: { lte: 0 } } });
  const total = await prisma.product.count();
  console.log(`\najustados: ${semEstoque.length} | produtos com estoque <= 0: ${restantes} | total de produtos: ${total}`);
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
