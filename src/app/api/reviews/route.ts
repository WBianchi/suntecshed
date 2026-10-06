import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, AUTH_COOKIE_NAME } from "@/lib/auth";

// GET — List reviews for a product (only approved)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");
    if (!productId) return NextResponse.json({ reviews: [] });

    const reviews = await prisma.review.findMany({
      where: { productId, approved: true },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error("Reviews list error:", error);
    return NextResponse.json({ reviews: [] });
  }
}

// POST — Create a review (authenticated user)
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Token inválido" }, { status: 401 });

    const { productId, rating, title, comment } = await req.json();

    if (!productId) return NextResponse.json({ error: "Produto obrigatório" }, { status: 400 });
    if (!rating || rating < 1 || rating > 5) return NextResponse.json({ error: "Nota deve ser de 1 a 5" }, { status: 400 });

    // Check if user already reviewed this product
    const existing = await prisma.review.findFirst({
      where: { productId, userId: payload.userId },
    });

    if (existing) {
      return NextResponse.json({ error: "Você já avaliou este produto" }, { status: 400 });
    }

    const review = await prisma.review.create({
      data: {
        productId,
        userId: payload.userId,
        rating,
        title: title || null,
        comment: comment || null,
        approved: false, // needs admin approval
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    });

    return NextResponse.json({ review, message: "Avaliação enviada! Será publicada após aprovação." });
  } catch (error) {
    console.error("Review create error:", error);
    return NextResponse.json({ error: "Erro ao enviar avaliação" }, { status: 500 });
  }
}

// GET user's reviews
export async function PUT(req: NextRequest) {
  try {
    const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ reviews: [] });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ reviews: [] });

    const reviews = await prisma.review.findMany({
      where: { userId: payload.userId },
      include: {
        product: {
          select: {
            id: true, name: true, slug: true,
            images: { take: 1, orderBy: { order: "asc" } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error("User reviews error:", error);
    return NextResponse.json({ reviews: [] });
  }
}
