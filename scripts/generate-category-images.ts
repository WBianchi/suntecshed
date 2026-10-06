import { writeFileSync, existsSync, readFileSync, mkdirSync } from "fs";
import { put } from "@vercel/blob";
import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

const OPENAI_KEY = process.env.OPENAI_API_KEY!;
const OUT_DIR = "/tmp/claude-1000/-home-willian--rea-de-Trabalho-c7drop/3c854225-7d96-4a08-8044-7c70803df932/scratchpad/categorias";
const CHECKPOINT_PATH = `${OUT_DIR}/checkpoint.json`;
const CONCURRENCY = 3;

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

interface CategorySpec {
  slug: string;
  title: string;
  subject: string; // descrição do produto/ícone em português, pro prompt
}

const CATEGORIES: CategorySpec[] = [
  { slug: "anuncios-em-massa", title: "ANÚNCIOS", subject: "uma pilha de etiquetas de preço e placas de anúncio 3D estilizadas, sem produto real" },
  { slug: "beleza-e-cuidado-pessoal", title: "BELEZA", subject: "um secador de cabelo profissional moderno" },
  { slug: "brinquedos", title: "BRINQUEDOS", subject: "um dinossauro de brinquedo colorido e um robô de brinquedo" },
  { slug: "caixas-de-som", title: "CAIXAS DE SOM", subject: "uma caixa de som bluetooth portátil moderna" },
  { slug: "cabos", title: "CARREGADORES", subject: "um power bank portátil com cabo de carregamento" },
  { slug: "casa-e-decoracao", title: "CASA", subject: "um organizador doméstico moderno e uma luminária de mesa" },
  { slug: "celulares-e-smartphones", title: "SMARTPHONES", subject: "um smartphone moderno com a tela levemente inclinada" },
  { slug: "copa-do-mundo", title: "COPA DO MUNDO", subject: "uma bola de futebol e um troféu dourado estilizados, sem produto real" },
  { slug: "cameras", title: "CÂMERAS", subject: "uma câmera digital compacta moderna" },
  { slug: "embalagens-e-etiquetas", title: "EMBALAGENS", subject: "uma caixa de papelão com etiquetas adesivas e fita" },
  { slug: "ferramentas", title: "FERRAMENTAS", subject: "uma furadeira/parafusadeira elétrica profissional" },
  { slug: "fones-de-ouvido", title: "FONES", subject: "um par de fones de ouvido sem fio estilo AirPods com o case aberto" },
  { slug: "fora-de-estoque", title: "ESGOTADO", subject: "um carimbo/selo estilizado 3D escrito nada além de uma forma de exclamação, sem produto real" },
  { slug: "games", title: "GAMES", subject: "um controle de videogame moderno" },
  { slug: "garrafas-copos-canecas", title: "COPOS E CANECAS", subject: "uma garrafa térmica e uma caneca modernas lado a lado" },
  { slug: "iluminacao", title: "ILUMINAÇÃO", subject: "uma fita de LED e uma lâmpada inteligente coloridas" },
  { slug: "informatica", title: "INFORMÁTICA", subject: "um mouse e um teclado sem fio modernos" },
  { slug: "produtos-mais-vendidos", title: "MAIS VENDIDOS", subject: "uma estrela/medalha dourada 3D estilizada de destaque, sem produto real" },
  { slug: "maquiagem", title: "MAQUIAGEM", subject: "uma paleta de maquiagem e um batom" },
  { slug: "materiais-de-pesca", title: "PESCA", subject: "uma vara de pescar e um carretel de pesca" },
  { slug: "media-streaming", title: "STREAMING", subject: "um dispositivo de streaming de TV moderno com controle remoto" },
  { slug: "papelaria", title: "PAPELARIA", subject: "uma caneta moderna e um caderno" },
  { slug: "produtos-diversos", title: "DIVERSOS", subject: "um conjunto variado de pequenos itens eletrônicos genéricos agrupados" },
  { slug: "promocoes-do-mes", title: "PROMOÇÕES", subject: "uma etiqueta de desconto 3D estilizada com símbolo de porcentagem, sem produto real" },
  { slug: "relogios-e-smartwatchs", title: "SMARTWATCH", subject: "um smartwatch moderno com a tela ligada" },
  { slug: "ring-light", title: "RING LIGHT", subject: "um ring light com tripé e suporte de celular" },
  { slug: "barbearia", title: "BARBEARIA", subject: "uma máquina de cortar cabelo profissional" },
  { slug: "umidificadores-de-ar", title: "VENTILADORES", subject: "um mini ventilador portátil moderno" },
];

function loadCheckpoint(): Record<string, string> {
  if (!existsSync(CHECKPOINT_PATH)) return {};
  try { return JSON.parse(readFileSync(CHECKPOINT_PATH, "utf-8")); } catch { return {}; }
}
function saveCheckpoint(map: Record<string, string>) {
  writeFileSync(CHECKPOINT_PATH, JSON.stringify(map, null, 2));
}

function buildPrompt(spec: CategorySpec): string {
  return `Fundo amarelo dourado vibrante (tom #F2B705) preenchido com faixas diagonais pretas grossas e formas geométricas pretas (círculos, quadrados, pontos, raios estilo burst), estilo pôster de marketing moderno e energético, alto contraste preto e amarelo. Centralizado no meio da composição: ${spec.subject}, fotografia de produto profissional, sombra suave, iluminação de estúdio, bem nítido e realista. Na parte de baixo da composição, a palavra "${spec.title}" escrita em letras GIGANTES, com uma tipografia bem grossa, arredondada, dinâmica e levemente inclinada (itálica esportiva), estilo logotipo de app/marca moderna, preenchimento branco com contorno preto grosso e leve sombra 3D — bem impactante, como um logotipo de destaque. Composição quadrada, produto centralizado, sem nenhum outro texto além do título.`;
}

async function runPool<T>(items: T[], worker: (item: T) => Promise<void>) {
  let next = 0;
  async function runner() {
    while (next < items.length) {
      const item = items[next++];
      await worker(item);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, runner));
}

async function generateOne(spec: CategorySpec): Promise<Buffer | null> {
  try {
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-image-2",
        prompt: buildPrompt(spec),
        size: "1024x1024",
        quality: "medium",
        n: 1,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      console.log(`  [erro ${spec.slug}] ${res.status} ${JSON.stringify(err)}`);
      return null;
    }
    const data = await res.json();
    const b64 = data.data[0].b64_json;
    return Buffer.from(b64, "base64");
  } catch (e: any) {
    console.log(`  [erro ${spec.slug}] ${e.message}`);
    return null;
  }
}

async function main() {
  const checkpoint = loadCheckpoint();
  const pending = CATEGORIES.filter((c) => !checkpoint[c.slug]);
  console.log(`${CATEGORIES.length} categorias no total, ${pending.length} restantes.`);

  let done = 0;
  await runPool(pending, async (spec) => {
    const buffer = await generateOne(spec);
    if (buffer) {
      const localPath = `${OUT_DIR}/${spec.slug}.png`;
      writeFileSync(localPath, buffer);
      checkpoint[spec.slug] = localPath;
      saveCheckpoint(checkpoint);
      done++;
      console.log(`  [ok ${done}/${pending.length}] ${spec.slug}`);
    }
  });

  console.log("Geração concluída. Subindo pro Blob e atualizando banco...");
  for (const spec of CATEGORIES) {
    const localPath = checkpoint[spec.slug];
    if (!localPath || !existsSync(localPath)) continue;
    const buffer = readFileSync(localPath);
    const blob = await put(`categorias/${spec.slug}.png`, buffer, { access: "public", contentType: "image/png" });
    await prisma.category.updateMany({ where: { slug: spec.slug }, data: { image: blob.url } });
    console.log(`  [blob+db] ${spec.slug} -> ${blob.url}`);
  }

  console.log("Concluído.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
