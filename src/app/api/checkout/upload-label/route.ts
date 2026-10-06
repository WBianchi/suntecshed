import { NextRequest, NextResponse } from "next/server";
import { verifyToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import { put } from "@vercel/blob";
import { randomUUID } from "crypto";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token || !verifyToken(token)) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Use uma imagem (JPG, PNG, WebP) ou PDF." }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Arquivo excede 10MB." }, { status: 400 });
    }

    const ext = file.name.split(".").pop() || "pdf";
    const uniqueName = `${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;

    const blob = await put(`etiquetas/${uniqueName}`, file, {
      access: "public",
      contentType: file.type,
    });

    return NextResponse.json({ url: blob.url, name: file.name });
  } catch (error: any) {
    console.error("Label upload error:", error);
    return NextResponse.json({ error: "Erro no upload da etiqueta" }, { status: 500 });
  }
}
