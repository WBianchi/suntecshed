import { NextRequest, NextResponse } from "next/server";
import { getAdminPayload, unauthorized } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

// ── PUT: Atualizar registro ────────────────────────────
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  const { id } = await params;

  try {
    const body = await req.json();
    const {
      clientName,
      title,
      salesValue,
      description,
      youtubeUrl,
      clientPhoto,
      trophyPhoto,
      achievementDate,
      category,
      displayOrder,
      active,
      featured,
    } = body;

    const existing = await prisma.hallOfFameEntry.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Registro não encontrado" }, { status: 404 });
    }

    // Determina youtubeId e thumbnail
    let youtubeId = existing.youtubeId;
    let thumbnail = existing.thumbnail;

    // Se o link do YouTube mudou
    if (youtubeUrl && youtubeUrl !== existing.youtubeUrl) {
      const extracted = extractYouTubeId(youtubeUrl.trim());
      if (!extracted) {
        return NextResponse.json({ error: "Link do YouTube inválido" }, { status: 400 });
      }
      youtubeId = extracted;
    }

    // Se a foto do cliente foi enviada (mesmo que null), recalcula thumbnail
    if (clientPhoto !== undefined) {
      if (clientPhoto && clientPhoto.trim()) {
        thumbnail = clientPhoto.trim();
      } else {
        // Fallback: usa thumbnail do YouTube com o youtubeId (novo ou existente)
        thumbnail = `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
      }
    } else if (youtubeUrl && youtubeUrl !== existing.youtubeUrl) {
      // Se só o YouTube mudou (e clientPhoto não veio), atualiza thumbnail do YouTube
      thumbnail = `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
    }

    const entry = await prisma.hallOfFameEntry.update({
      where: { id },
      data: {
        ...(clientName !== undefined && { clientName: clientName.trim() }),
        ...(title !== undefined && { title: title.trim() }),
        ...(salesValue !== undefined && { salesValue }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(youtubeUrl !== undefined && { youtubeUrl: youtubeUrl.trim(), youtubeId, thumbnail }),
        ...(clientPhoto !== undefined && { clientPhoto: clientPhoto || null, thumbnail }),
        ...(trophyPhoto !== undefined && { trophyPhoto: trophyPhoto || null }),
        ...(achievementDate !== undefined && { achievementDate: achievementDate ? new Date(achievementDate) : null }),
        ...(category !== undefined && { category }),
        ...(displayOrder !== undefined && { displayOrder }),
        ...(active !== undefined && { active }),
        ...(featured !== undefined && { featured }),
      },
    });

    return NextResponse.json(entry);
  } catch (error: any) {
    console.error("Hall of Fame update error:", error);
    return NextResponse.json({ error: "Erro ao atualizar registro" }, { status: 500 });
  }
}

// ── DELETE: Excluir registro ───────────────────────────
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  const { id } = await params;

  try {
    const existing = await prisma.hallOfFameEntry.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Registro não encontrado" }, { status: 404 });
    }

    await prisma.hallOfFameEntry.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Hall of Fame delete error:", error);
    return NextResponse.json({ error: "Erro ao excluir registro" }, { status: 500 });
  }
}

// ── Helper: Extrair ID do YouTube ──────────────────────
function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  let match = url.match(/(?:youtube\.com\/watch\?v=)([\w-]{11})/);
  if (match) return match[1];
  match = url.match(/(?:youtu\.be\/)([\w-]{11})/);
  if (match) return match[1];
  match = url.match(/(?:youtube\.com\/shorts\/)([\w-]{11})/);
  if (match) return match[1];
  match = url.match(/(?:youtube\.com\/embed\/)([\w-]{11})/);
  if (match) return match[1];
  match = url.match(/(?:youtube\.com\/live\/)([\w-]{11})/);
  if (match) return match[1];
  return null;
}
