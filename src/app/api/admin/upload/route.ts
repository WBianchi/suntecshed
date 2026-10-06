import { NextRequest, NextResponse } from "next/server";
import { getAdminPayload, unauthorized } from "@/lib/admin-auth";
import { put } from "@vercel/blob";
import { randomUUID } from "crypto";
import sharp from "sharp";

const MAX_WIDTH = 1920;
const WEBP_QUALITY = 82;

// Tipos que não passam pelo otimizador: SVG é vetor (nada a redimensionar) e
// GIF pode ser animado — reencodar como WebP estático quebraria a animação.
const SKIP_OPTIMIZATION = new Set(["image/svg+xml", "image/gif"]);

async function optimizeImage(buffer: Buffer, mimeType: string): Promise<{ buffer: Buffer; contentType: string; ext: string }> {
  if (SKIP_OPTIMIZATION.has(mimeType)) {
    return { buffer, contentType: mimeType, ext: mimeType === "image/svg+xml" ? "svg" : "gif" };
  }
  const optimized = await sharp(buffer)
    .rotate() // aplica a orientação EXIF antes de redimensionar
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();
  return { buffer: optimized, contentType: "image/webp", ext: "webp" };
}

export async function POST(req: NextRequest) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml", "image/avif"];
    const maxSize = 5 * 1024 * 1024; // 5MB

    const uploaded: { url: string; name: string; size: number }[] = [];

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `Tipo não permitido: ${file.type}. Use JPG, PNG, WebP, GIF, SVG ou AVIF.` },
          { status: 400 }
        );
      }

      if (file.size > maxSize) {
        return NextResponse.json(
          { error: `Arquivo "${file.name}" excede 5MB.` },
          { status: 400 }
        );
      }

      const rawBuffer = Buffer.from(await file.arrayBuffer());
      const { buffer, contentType, ext } = await optimizeImage(rawBuffer, file.type);
      const uniqueName = `${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;

      const blob = await put(`uploads/${uniqueName}`, buffer, {
        access: "public",
        contentType,
      });

      uploaded.push({
        url: blob.url,
        name: file.name,
        size: buffer.length,
      });
    }

    return NextResponse.json({ files: uploaded });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Erro no upload" }, { status: 500 });
  }
}
