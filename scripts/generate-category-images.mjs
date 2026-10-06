/**
 * Gera as imagens das categorias da home no design do C7drop adaptado pra marca
 * do Suntecshed: fundo roxo escuro (#2E0F4A), pattern geométrico branco,
 * produto 3D centralizado e rótulo em inglês embaixo.
 *
 * Uso:
 *   node scripts/generate-category-images.mjs                      # gera todas as categorias do json
 *   node scripts/generate-category-images.mjs fones-de-ouvido      # gera só as informadas
 *   node scripts/generate-category-images.mjs --forcar fones-de-ouvido   # regera mesmo se já existir
 *
 * Requer OPENAI_API_KEY no ambiente (o `.env` do projeto tem a chave).
 * Saída: public/categorias-home/<slug>.png
 */
import fs from "node:fs";
import path from "node:path";

const MODELOS = ["gpt-image-2.5-flare", "gpt-image-2", "gpt-image-1.5", "gpt-image-1"];

const arquivoDados = path.join(process.cwd(), "scripts", "data", "categorias-home.json");
const pastaSaida = path.join(process.cwd(), "public", "categorias-home");

const argumentos = process.argv.slice(2);
const forcar = argumentos.includes("--forcar");
const slugs = argumentos.filter((a) => !a.startsWith("--"));

function montarPrompt(item) {
  return [
    "A square 1:1 e-commerce category card, 1024x1024, flat promotional poster layout.",
    "BACKGROUND: very dark purple (#2E0F4A) filling the whole artboard edge to edge. No frame, no border, no vignette, no gradient bands.",
    "PATTERN: flat solid WHITE geometric pop-art shapes scattered over the purple background - thick 45 degree diagonal stripes, clusters of halftone dots, solid circles and outlined squares of varied sizes, thin speed lines, sharp triangular shards and small confetti dots. Pure white, high contrast, no transparency, no shadows on the shapes. Asymmetric, energetic composition like a streetwear sale poster.",
    `HERO PRODUCT: ${item.produto}. Photorealistic 3D product render, centered horizontally and slightly above the vertical center, occupying about 45% of the width. Soft studio lighting from the top front, crisp specular highlights, subtle purple rim light on the edges, soft diffused shadow under the product, no floor, no reflection.`,
    `TEXT: at the bottom, centered, the single word "${item.rotulo}" in a heavy italic uppercase sans-serif, white fill with a thick dark outline and a hard offset shadow (loud 3D sale poster look). Write exactly "${item.rotulo}" - no other letters, no logos, no watermarks, no extra text, no UI elements. Any packaging, box, tag or label must stay completely blank: the only lettering in the whole image is the word "${item.rotulo}".`,
  ].join("\n");
}

async function gerarComOpenAI(modelo, item) {
  const resposta = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: modelo,
      prompt: montarPrompt(item),
      size: "1024x1024",
      quality: "high",
      output_format: "png",
      n: 1,
    }),
  });

  const json = await resposta.json();
  if (!resposta.ok) {
    throw new Error(`${resposta.status} ${json?.error?.message || JSON.stringify(json).slice(0, 200)}`);
  }

  const b64 = json?.data?.[0]?.b64_json;
  if (!b64) throw new Error("resposta sem b64_json");

  const destino = path.join(pastaSaida, `${item.slug}.png`);
  fs.writeFileSync(destino, Buffer.from(b64, "base64"));
  return { destino, bytes: fs.statSync(destino).size, uso: json?.usage };
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error("faltou OPENAI_API_KEY no ambiente (rode com `set -a && . ./.env && set +a`)");
    process.exit(1);
  }

  const todos = JSON.parse(fs.readFileSync(arquivoDados, "utf8"));
  const fila = slugs.length ? todos.filter((item) => slugs.includes(item.slug)) : todos;
  if (fila.length === 0) {
    console.error(`nenhuma categoria bateu. disponíveis: ${todos.map((i) => i.slug).join(", ")}`);
    process.exit(1);
  }

  fs.mkdirSync(pastaSaida, { recursive: true });

  for (const item of fila) {
    const destino = path.join(pastaSaida, `${item.slug}.png`);
    if (fs.existsSync(destino) && !forcar) {
      console.log(`pulando ${item.slug} (já existe: ${destino})`);
      continue;
    }

    let pronto = false;
    for (const modelo of MODELOS) {
      const inicio = Date.now();
      try {
        const { bytes, uso } = await gerarComOpenAI(modelo, item);
        console.log(
          `ok  ${item.slug} -> ${destino}\n     modelo: ${modelo} | ${(bytes / 1024).toFixed(0)} KB | ${((Date.now() - inicio) / 1000).toFixed(1)}s | tokens: ${JSON.stringify(uso || {})}`,
        );
        pronto = true;
        break;
      } catch (erro) {
        console.log(`falhou ${item.slug} com ${modelo}: ${String(erro.message).slice(0, 160)}`);
      }
    }
    if (!pronto) console.log(`ERRO: não consegui gerar ${item.slug} com nenhum modelo`);
  }
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
