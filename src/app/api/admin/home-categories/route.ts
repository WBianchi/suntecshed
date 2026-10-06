import { NextRequest, NextResponse } from "next/server";
import { getAdminPayload, unauthorized } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  const items = await prisma.homeCategoryItem.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  try {
    const body = await req.json();
    const { categoryId, title, image, link, order, active } = body;

    if (!title) return NextResponse.json({ error: "Título é obrigatório" }, { status: 400 });

    let finalLink = link;
    if (categoryId && !link) {
      const cat = await prisma.category.findUnique({ where: { id: categoryId }, select: { slug: true } });
      if (cat) finalLink = `/produtos?categoria=${cat.slug}`;
    }

    const item = await prisma.homeCategoryItem.create({
      data: { categoryId, title, image, link: finalLink, order: order ?? 0, active: active ?? true },
    });
    return NextResponse.json(item);
  } catch (error: any) {
    return NextResponse.json({ error: "Erro ao criar item" }, { status: 500 });
  }
}
