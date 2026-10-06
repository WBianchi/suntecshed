import { NextRequest, NextResponse } from "next/server";
import { getAdminPayload, unauthorized } from "@/lib/admin-auth";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_URL = process.env.DEEPSEEK_API_BASE_URL
  ? `${process.env.DEEPSEEK_API_BASE_URL}/chat/completions`
  : "https://api.deepseek.com/chat/completions";

export async function POST(req: NextRequest) {
  const admin = getAdminPayload(req);
  if (!admin) return unauthorized();

  if (!DEEPSEEK_API_KEY) {
    return NextResponse.json({ error: "DEEPSEEK_API_KEY não configurada" }, { status: 500 });
  }

  try {
    const { channel, purpose, storeName, tone } = await req.json();

    const channelLabel = channel === "whatsapp" ? "WhatsApp" : "E-mail Marketing";
    const toneLabel = tone || "profissional e amigável";

    const prompt = `Você é um copywriter especialista em ${channelLabel} para e-commerce de eletrônicos e dropshipping.

Loja: ${storeName || "C7 Drop"}
Objetivo da campanha: ${purpose}
Tom: ${toneLabel}

Gere um template completo no seguinte formato JSON (sem markdown, apenas JSON puro):
{
  "subject": "assunto do email (apenas para email, se whatsapp deixe vazio)",
  "body": "corpo da mensagem${channel === "whatsapp" ? " (use emojis, máximo 1000 caracteres, sem HTML)" : " (HTML com <p>, <strong>, <ul>, <li>, pode usar emojis)"}",
  "footer": "texto do rodapé curto"
}

Regras:
- Mensagem persuasiva e com call-to-action claro
- Use o nome da loja naturalmente
${channel === "whatsapp" ? "- Use emojis e linguagem direta (WhatsApp é informal)\n- Quebre linhas com \\n\n- Não use HTML" : "- Use HTML semântico para formatação\n- Inclua CTA com botão visual em HTML"}
- Retorne APENAS o JSON, sem explicações`;

    const response = await fetch(DEEPSEEK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
        messages: [
          { role: "system", content: "Você gera templates de marketing. Responda APENAS com JSON válido, sem markdown." },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      console.error("DeepSeek error:", await response.text());
      return NextResponse.json({ error: "Erro na API de IA" }, { status: 502 });
    }

    const data = await response.json();
    let text = data.choices?.[0]?.message?.content?.trim() || "";

    // Clean markdown code block if present
    text = text.replace(/^```json?\n?/i, "").replace(/\n?```$/i, "").trim();

    try {
      const parsed = JSON.parse(text);
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json({ subject: "", body: text, footer: "" });
    }
  } catch (error) {
    console.error("AI template error:", error);
    return NextResponse.json({ error: "Erro ao gerar template" }, { status: 500 });
  }
}
