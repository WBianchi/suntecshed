import { NextRequest, NextResponse } from "next/server";
import { getAdminPayload, unauthorized } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { del } from "@vercel/blob";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  const { id } = await params;
  try {
    const body = await req.json();
    const { title, description, category, thumbnail } = body;

    const video = await prisma.trainingVideo.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(category !== undefined && { category }),
        ...(thumbnail !== undefined && { thumbnail }),
      },
    });

    return NextResponse.json(video);
  } catch (error: any) {
    console.error("Update training video error:", error);
    return NextResponse.json({ error: "Erro ao atualizar vídeo" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  const { id } = await params;
  try {
    const video = await prisma.trainingVideo.findUnique({ where: { id } });
    if (!video) return NextResponse.json({ error: "Vídeo não encontrado" }, { status: 404 });

    // Delete blob files if they exist
    const urlsToDelete = [video.videoUrl, video.thumbnail].filter((u): u is string => !!u && u.startsWith("https://"));
    for (const url of urlsToDelete) {
      try { await del(url); } catch {}
    }

    await prisma.trainingVideo.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Delete training video error:", error);
    return NextResponse.json({ error: "Erro ao excluir vídeo" }, { status: 500 });
  }
}
