import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, AUTH_COOKIE_NAME } from "@/lib/auth";

// GET — List user favorites
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ favorites: [] });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ favorites: [] });

    const favorites = await prisma.favorite.findMany({
      where: { userId: payload.userId },
      include: {
        product: {
          select: {
            id: true, name: true, slug: true, price: true, compareAtPrice: true,
            images: { take: 1, orderBy: { order: "asc" } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ favorites });
  } catch (error) {
    console.error("Favorites list error:", error);
    return NextResponse.json({ favorites: [] });
  }
}

// POST — Toggle favorite
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Token inválido" }, { status: 401 });

    const { productId } = await req.json();
    if (!productId) return NextResponse.json({ error: "productId obrigatório" }, { status: 400 });

    const existing = await prisma.favorite.findUnique({
      where: { userId_productId: { userId: payload.userId, productId } },
    });

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      return NextResponse.json({ favorited: false });
    }

    await prisma.favorite.create({ data: { userId: payload.userId, productId } });
    return NextResponse.json({ favorited: true });
  } catch (error) {
    console.error("Favorite toggle error:", error);
    return NextResponse.json({ error: "Erro ao favoritar" }, { status: 500 });
  }
}
