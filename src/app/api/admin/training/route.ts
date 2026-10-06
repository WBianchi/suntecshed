import { NextRequest, NextResponse } from "next/server";
import { getAdminPayload, unauthorized } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") || "";
  const search = searchParams.get("search") || "";

  const where: any = {};
  if (category) where.category = category;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const videos = await prisma.trainingVideo.findMany({
    where,
    orderBy: { title: "asc" },
  });

  return NextResponse.json(videos);
}

export async function POST(req: NextRequest) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  try {
    const body = await req.json();
    const { title, description, category, videoUrl, thumbnail, duration, fileSize } = body;

    if (!title || !videoUrl) {
      return NextResponse.json({ error: "Título e URL do vídeo são obrigatórios" }, { status: 400 });
    }

    const video = await prisma.trainingVideo.create({
      data: {
        title,
        description: description || null,
        category: category || "geral",
        videoUrl,
        originalUrl: videoUrl,
        thumbnail: thumbnail || null,
        duration: duration || null,
        fileSize: fileSize || null,
        status: "ready",
      },
    });

    return NextResponse.json(video);
  } catch (error: any) {
    console.error("Create training video error:", error);
    return NextResponse.json({ error: "Erro ao criar vídeo" }, { status: 500 });
  }
}
