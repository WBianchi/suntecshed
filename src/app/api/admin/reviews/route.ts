import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET — List all reviews (admin)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // "pending" | "approved" | "rejected" | ""
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status === "pending") where.approved = false;
    else if (status === "approved") where.approved = true;

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { comment: { contains: search, mode: "insensitive" } },
        { user: { name: { contains: search, mode: "insensitive" } } },
        { product: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true } },
          product: {
            select: {
              id: true, name: true, slug: true,
              images: { take: 1, orderBy: { order: "asc" } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.review.count({ where }),
    ]);

    return NextResponse.json({
      reviews,
      total,
      totalPages: Math.ceil(total / limit),
      page,
    });
  } catch (error) {
    console.error("Admin reviews list error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
