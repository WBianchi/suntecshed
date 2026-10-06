import { NextRequest, NextResponse } from "next/server";
import { getAdminPayload, unauthorized } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  const { id } = await params;
  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post) return NextResponse.json({ error: "Post não encontrado" }, { status: 404 });
  return NextResponse.json(post);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  const { id } = await params;
  try {
    const body = await req.json();
    const { title, slug, excerpt, content, coverImage, author, tags, published } = body;

    const data: any = {};
    if (title !== undefined) data.title = title;
    if (slug !== undefined) data.slug = slug;
    if (excerpt !== undefined) data.excerpt = excerpt;
    if (content !== undefined) data.content = content;
    if (coverImage !== undefined) data.coverImage = coverImage;
    if (author !== undefined) data.author = author;
    if (tags !== undefined) data.tags = tags;
    if (published !== undefined) {
      data.published = published;
      if (published) {
        const existing = await prisma.blogPost.findUnique({ where: { id }, select: { publishedAt: true } });
        if (!existing?.publishedAt) data.publishedAt = new Date();
      }
    }

    const post = await prisma.blogPost.update({ where: { id }, data });
    return NextResponse.json(post);
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  const { id } = await params;
  try {
    await prisma.blogPost.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro ao excluir" }, { status: 500 });
  }
}
