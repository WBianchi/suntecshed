import { NextRequest, NextResponse } from "next/server";
import { getAdminPayload, unauthorized } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  const url = new URL(req.url);
  const search = url.searchParams.get("search") || "";
  const status = url.searchParams.get("status") || "";
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "20");
  const sort = url.searchParams.get("sort") || "createdAt";
  const order = url.searchParams.get("order") || "desc";

  const where: any = {};
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { tags: { hasSome: [search] } },
    ];
  }
  if (status === "published") where.published = true;
  else if (status === "draft") where.published = false;

  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      orderBy: { [sort]: order },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.blogPost.count({ where }),
  ]);

  return NextResponse.json({ posts, total, pages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  try {
    const body = await req.json();
    const { title, slug, excerpt, content, coverImage, author, tags, published } = body;

    if (!title || !slug) {
      return NextResponse.json({ error: "Título e slug são obrigatórios" }, { status: 400 });
    }

    const exists = await prisma.blogPost.findUnique({ where: { slug } });
    if (exists) return NextResponse.json({ error: "Slug já existe" }, { status: 400 });

    const post = await prisma.blogPost.create({
      data: {
        title, slug, excerpt, content, coverImage, author, tags: tags || [],
        published: published || false,
        publishedAt: published ? new Date() : null,
      },
    });
    return NextResponse.json(post);
  } catch (error: any) {
    console.error("Blog create error:", error);
    return NextResponse.json({ error: "Erro ao criar post" }, { status: 500 });
  }
}
