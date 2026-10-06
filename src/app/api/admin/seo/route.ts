import { NextRequest, NextResponse } from "next/server";
import { getAdminPayload, unauthorized } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  const url = new URL(req.url);
  const page = url.searchParams.get("page");

  if (page) {
    let seo = await prisma.seoSettings.findUnique({ where: { page } });
    if (!seo) {
      seo = await prisma.seoSettings.create({ data: { page } });
    }
    return NextResponse.json(seo);
  }

  const allSeo = await prisma.seoSettings.findMany({ orderBy: { page: "asc" } });
  return NextResponse.json(allSeo);
}

export async function PUT(req: NextRequest) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  try {
    const body = await req.json();
    const { page, title, metaDescription, metaKeywords, favicon, ogImage, ogTitle, ogDescription } = body;

    if (!page) return NextResponse.json({ error: "Page é obrigatório" }, { status: 400 });

    const seo = await prisma.seoSettings.upsert({
      where: { page },
      create: { page, title, metaDescription, metaKeywords, favicon, ogImage, ogTitle, ogDescription },
      update: { title, metaDescription, metaKeywords, favicon, ogImage, ogTitle, ogDescription },
    });

    return NextResponse.json(seo);
  } catch (error: any) {
    console.error("SEO settings error:", error);
    return NextResponse.json({ error: "Erro ao salvar" }, { status: 500 });
  }
}
