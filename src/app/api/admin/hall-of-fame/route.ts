import { NextRequest, NextResponse } from "next/server";
import { getAdminPayload, unauthorized } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

// ── GET: Listar todos os registros ──────────────────────
export async function GET(req: NextRequest) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const status = searchParams.get("status") || ""; // "active", "inactive", ""

  const where: any = {};

  if (search) {
    where.OR = [
      { clientName: { contains: search, mode: "insensitive" } },
      { title: { contains: search, mode: "insensitive" } },
    ];
  }

  if (category) where.category = category;

  if (status === "active") where.active = true;
  else if (status === "inactive") where.active = false;

  const entries = await prisma.hallOfFameEntry.findMany({
    where,
    orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(entries);
}

// ── POST: Criar novo registro ──────────────────────────
export async function POST(req: NextRequest) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

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

    // Validações
    if (!clientName?.trim()) {
      return NextResponse.json({ error: "Nome do cliente é obrigatório" }, { status: 400 });
    }
    if (!title?.trim()) {
      return NextResponse.json({ error: "Título da conquista é obrigatório" }, { status: 400 });
    }
    if (!youtubeUrl?.trim()) {
      return NextResponse.json({ error: "Link do YouTube é obrigatório" }, { status: 400 });
    }

    // Extrai ID do YouTube
    const youtubeId = extractYouTubeId(youtubeUrl.trim());
    if (!youtubeId) {
      return NextResponse.json({ error: "Link do YouTube inválido. Use um link do tipo youtube.com/watch?v=..., youtu.be/... ou youtube.com/shorts/..." }, { status: 400 });
    }

    // Usa foto do cliente como thumbnail se disponível, senão usa capa do YouTube
    const thumbnail = (clientPhoto && clientPhoto.trim())
      ? clientPhoto.trim()
      : `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;

    const entry = await prisma.hallOfFameEntry.create({
      data: {
        clientName: clientName.trim(),
        title: title.trim(),
        salesValue: salesValue || 0,
        description: description?.trim() || null,
        youtubeUrl: youtubeUrl.trim(),
        youtubeId,
        thumbnail,
        clientPhoto: clientPhoto || null,
        trophyPhoto: trophyPhoto || null,
        achievementDate: achievementDate ? new Date(achievementDate) : null,
        category: category || "50k",
        displayOrder: displayOrder ?? 0,
        active: active ?? true,
        featured: featured ?? false,
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error: any) {
    console.error("Hall of Fame create error:", error);
    return NextResponse.json({ error: "Erro ao criar registro" }, { status: 500 });
  }
}

// ── Helper: Extrair ID do YouTube ──────────────────────
function extractYouTubeId(url: string): string | null {
  if (!url) return null;

  // youtube.com/watch?v=ID
  let match = url.match(/(?:youtube\.com\/watch\?v=)([\w-]{11})/);
  if (match) return match[1];

  // youtu.be/ID
  match = url.match(/(?:youtu\.be\/)([\w-]{11})/);
  if (match) return match[1];

  // youtube.com/shorts/ID
  match = url.match(/(?:youtube\.com\/shorts\/)([\w-]{11})/);
  if (match) return match[1];

  // youtube.com/embed/ID
  match = url.match(/(?:youtube\.com\/embed\/)([\w-]{11})/);
  if (match) return match[1];

  // youtube.com/live/ID
  match = url.match(/(?:youtube\.com\/live\/)([\w-]{11})/);
  if (match) return match[1];

  return null;
}
