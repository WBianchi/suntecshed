/**
 * Popula as categorias da loja com a MESMA lista que existia no projeto
 * antigo (C7drop): nomes, slugs e imagens idênticos, na mesma ordem.
 *
 * Uso:
 *   npx tsx scripts/seed-categories.ts              # só as categorias
 *   npx tsx scripts/seed-categories.ts --home-items # + cards da home
 *
 * Idempotente: categoria usa upsert por slug; home item só cria se ainda
 * não existir um com o mesmo título. Rodar de novo não duplica.
 *
 * Observação: as imagens apontam pro Vercel Blob do projeto antigo. Pra
 * desacoplar, suba os arquivos no Blob do Suntecshed e troque as URLs.
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

type Categoria = { name: string; slug: string; order: number; image: string };

const categorias: Categoria[] = [
  { name: "Anúncios em Massa", slug: "anuncios-em-massa", order: 0, image: "https://wfd7n2enlsvgxasp.public.blob.vercel-storage.com/categorias/anuncios-em-massa.png" },
  { name: "Beleza e Cuidado Pessoal", slug: "beleza-e-cuidado-pessoal", order: 1, image: "https://wfd7n2enlsvgxasp.public.blob.vercel-storage.com/categorias/beleza-e-cuidado-pessoal.png" },
  { name: "Brinquedos", slug: "brinquedos", order: 2, image: "https://wfd7n2enlsvgxasp.public.blob.vercel-storage.com/categorias/brinquedos.png" },
  { name: "Caixas de Som", slug: "caixas-de-som", order: 3, image: "https://wfd7n2enlsvgxasp.public.blob.vercel-storage.com/categorias/caixas-de-som.png" },
  { name: "Carregadores & Power Banks", slug: "cabos", order: 4, image: "https://wfd7n2enlsvgxasp.public.blob.vercel-storage.com/categorias/cabos.png" },
  { name: "Casa e Utensílios Domésticos", slug: "casa-e-decoracao", order: 5, image: "https://wfd7n2enlsvgxasp.public.blob.vercel-storage.com/categorias/casa-e-decoracao.png" },
  { name: "Celulares e Smartphones", slug: "celulares-e-smartphones", order: 6, image: "https://wfd7n2enlsvgxasp.public.blob.vercel-storage.com/categorias/celulares-e-smartphones.png" },
  { name: "Copa do Mundo", slug: "copa-do-mundo", order: 7, image: "https://wfd7n2enlsvgxasp.public.blob.vercel-storage.com/categorias/copa-do-mundo.png" },
  { name: "Câmeras", slug: "cameras", order: 8, image: "https://wfd7n2enlsvgxasp.public.blob.vercel-storage.com/categorias/cameras.png" },
  { name: "Embalagens e Etiquetas", slug: "embalagens-e-etiquetas", order: 9, image: "https://wfd7n2enlsvgxasp.public.blob.vercel-storage.com/categorias/embalagens-e-etiquetas.png" },
  { name: "Ferramentas", slug: "ferramentas", order: 10, image: "https://wfd7n2enlsvgxasp.public.blob.vercel-storage.com/categorias/ferramentas.png" },
  { name: "Fones de Ouvido", slug: "fones-de-ouvido", order: 11, image: "https://wfd7n2enlsvgxasp.public.blob.vercel-storage.com/categorias/fones-de-ouvido.png" },
  { name: "Fora de Estoque", slug: "fora-de-estoque", order: 12, image: "https://wfd7n2enlsvgxasp.public.blob.vercel-storage.com/categorias/fora-de-estoque.png" },
  { name: "Games", slug: "games", order: 13, image: "https://wfd7n2enlsvgxasp.public.blob.vercel-storage.com/categorias/games.png" },
  { name: "Garrafas, Copos e Canecas", slug: "garrafas-copos-canecas", order: 14, image: "https://wfd7n2enlsvgxasp.public.blob.vercel-storage.com/categorias/garrafas-copos-canecas.png" },
  { name: "Iluminação", slug: "iluminacao", order: 15, image: "https://wfd7n2enlsvgxasp.public.blob.vercel-storage.com/categorias/iluminacao.png" },
  { name: "Informática", slug: "informatica", order: 16, image: "https://wfd7n2enlsvgxasp.public.blob.vercel-storage.com/categorias/informatica.png" },
  { name: "Mais vendidos", slug: "produtos-mais-vendidos", order: 17, image: "https://wfd7n2enlsvgxasp.public.blob.vercel-storage.com/categorias/produtos-mais-vendidos.png" },
  { name: "Maquiagem", slug: "maquiagem", order: 18, image: "https://wfd7n2enlsvgxasp.public.blob.vercel-storage.com/categorias/maquiagem.png" },
  { name: "Materiais de Pesca", slug: "materiais-de-pesca", order: 19, image: "https://wfd7n2enlsvgxasp.public.blob.vercel-storage.com/categorias/materiais-de-pesca.png" },
  { name: "Media Streaming", slug: "media-streaming", order: 20, image: "https://wfd7n2enlsvgxasp.public.blob.vercel-storage.com/categorias/media-streaming.png" },
  { name: "Papelaria", slug: "papelaria", order: 21, image: "https://wfd7n2enlsvgxasp.public.blob.vercel-storage.com/categorias/papelaria.png" },
  { name: "Produto de Natal", slug: "produto-de-natal", order: 22, image: "https://wfd7n2enlsvgxasp.public.blob.vercel-storage.com/uploads/1786819189374-776a8bc5.webp" },
  { name: "Produtos diversos", slug: "produtos-diversos", order: 23, image: "https://wfd7n2enlsvgxasp.public.blob.vercel-storage.com/categorias/produtos-diversos.png" },
  { name: "Promoções do Mês", slug: "promocoes-do-mes", order: 24, image: "https://wfd7n2enlsvgxasp.public.blob.vercel-storage.com/categorias/promocoes-do-mes.png" },
  { name: "Relogios e Smartwatchs", slug: "relogios-e-smartwatchs", order: 25, image: "https://wfd7n2enlsvgxasp.public.blob.vercel-storage.com/categorias/relogios-e-smartwatchs.png" },
  { name: "Ring Light & Suportes", slug: "ring-light", order: 26, image: "https://wfd7n2enlsvgxasp.public.blob.vercel-storage.com/categorias/ring-light.png" },
  { name: "Salão & Barbearia", slug: "barbearia", order: 27, image: "https://wfd7n2enlsvgxasp.public.blob.vercel-storage.com/categorias/barbearia.png" },
  { name: "Umidificadores & Ventiladores", slug: "umidificadores-de-ar", order: 28, image: "https://wfd7n2enlsvgxasp.public.blob.vercel-storage.com/categorias/umidificadores-de-ar.png" },
];

// Cards que a tela /admin/ferramentas/categorias-home gerencia.
const homeItems: { slug: string; title: string }[] = [
  { slug: "promocoes-do-mes", title: "Promoções do Mês" },
  { slug: "produtos-mais-vendidos", title: "Mais Vendidos" },
  { slug: "fones-de-ouvido", title: "Fones de Ouvido" },
  { slug: "cabos", title: "Carregadores & Power Banks" },
  { slug: "caixas-de-som", title: "Caixas de Som" },
  { slug: "celulares-e-smartphones", title: "Celulares e Smartphones" },
  { slug: "informatica", title: "Informática" },
  { slug: "iluminacao", title: "Iluminação" },
  { slug: "casa-e-decoracao", title: "Casa e Utensílios Domésticos" },
  { slug: "relogios-e-smartwatchs", title: "Relógios e Smartwatches" },
];

async function main() {
  const comHome = process.argv.includes("--home-items");
  let criadas = 0;
  let atualizadas = 0;

  for (const cat of categorias) {
    const existente = await prisma.category.findUnique({
      where: { slug: cat.slug },
      select: { id: true },
    });

    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: { name: cat.name, image: cat.image, order: cat.order },
      create: { name: cat.name, slug: cat.slug, image: cat.image, order: cat.order },
    });

    if (existente) atualizadas++;
    else criadas++;
  }

  console.log(`categorias: ${criadas} criadas, ${atualizadas} atualizadas (total ${categorias.length})`);

  if (!comHome) return;

  let hCriados = 0;
  for (const [indice, item] of homeItems.entries()) {
    const categoria = await prisma.category.findUnique({
      where: { slug: item.slug },
      select: { id: true, image: true },
    });
    if (!categoria) {
      console.warn(`  ! categoria ${item.slug} nao existe, pulei o card`);
      continue;
    }

    const jaExiste = await prisma.homeCategoryItem.findFirst({ where: { title: item.title } });
    if (jaExiste) continue;

    await prisma.homeCategoryItem.create({
      data: {
        categoryId: categoria.id,
        title: item.title,
        image: categoria.image,
        link: `/categoria/${item.slug}`,
        order: indice,
        active: true,
      },
    });
    hCriados++;
  }

  console.log(`home items: ${hCriados} criados`);
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
