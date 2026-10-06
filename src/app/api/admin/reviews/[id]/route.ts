import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT — Approve/reject review
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { approved } = body;

    const review = await prisma.review.update({
      where: { id },
      data: { approved: !!approved },
    });

    return NextResponse.json({ review });
  } catch (error) {
    console.error("Admin review update error:", error);
    return NextResponse.json({ error: "Erro ao atualizar avaliação" }, { status: 500 });
  }
}

// DELETE — Remove review
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.review.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin review delete error:", error);
    return NextResponse.json({ error: "Erro ao excluir avaliação" }, { status: 500 });
  }
}
