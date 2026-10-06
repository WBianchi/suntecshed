import { NextRequest, NextResponse } from "next/server";
import { getAdminPayload, unauthorized } from "@/lib/admin-auth";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";

export async function POST(req: NextRequest) {
  const admin = getAdminPayload(req);
  if (!admin) return unauthorized();

  if (!DEEPSEEK_API_KEY) {
    return NextResponse.json({ error: "DEEPSEEK_API_KEY não configurada" }, { status: 500 });
  }

  try {
    const { type, productName, category, keywords } = await req.json();

    const prompts: Record<string, string> = {
      title: `Gere um título otimizado para SEO de um produto de e-commerce de eletrônicos e dropshipping chamado "${productName}". 
Categoria: ${category || ""}. 
Palavras-chave: ${keywords || "eletrônicos, dropshipping, atacado"}.
Retorne APENAS o título, sem aspas, sem explicação. Máximo 70 caracteres.`,

      shortDescription: `Gere uma descrição curta e atrativa para o produto "${productName}" de uma loja de eletrônicos e dropshipping.
Categoria: ${category || ""}.
Retorne APENAS a descrição curta em 1-2 frases. Máximo 160 caracteres. Foque em benefícios e qualidade.`,

      description: `Gere uma descrição completa e detalhada para o produto "${productName}" de uma loja de eletrônicos e dropshipping.
Categoria: ${category || ""}.
Palavras-chave: ${keywords || ""}.

A descrição deve:
- Ter 3-5 parágrafos
- Destacar benefícios, materiais, qualidade
- Usar linguagem persuasiva e profissional
- Incluir detalhes técnicos quando possível
- Ser otimizada para SEO
- Usar emojis pontuais para destacar pontos

Retorne APENAS a descrição em HTML simples (use <p>, <strong>, <ul>, <li>).`,

      seoTitle: `Gere um meta title SEO otimizado para o produto "${productName}" de uma loja de eletrônicos e dropshipping.
Inclua a marca "C7 Drop" no final.
Máximo 60 caracteres. Retorne APENAS o título.`,

      seoDescription: `Gere uma meta description SEO otimizada para o produto "${productName}" de uma loja de eletrônicos e dropshipping.
Categoria: ${category || ""}.
Máximo 155 caracteres. Inclua call-to-action. Retorne APENAS a descrição.`,
    };

    const prompt = prompts[type];
    if (!prompt) {
      return NextResponse.json({ error: "Tipo de geração inválido" }, { status: 400 });
    }

    const response = await fetch(DEEPSEEK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "Você é um copywriter especialista em e-commerce de eletrônicos e dropshipping. Sempre responda em português do Brasil." },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("DeepSeek API error:", errText);
      return NextResponse.json({ error: "Erro na API de IA" }, { status: 502 });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content?.trim() || "";

    return NextResponse.json({ text });
  } catch (error) {
    console.error("AI generate error:", error);
    return NextResponse.json({ error: "Erro ao gerar conteúdo" }, { status: 500 });
  }
}
