import { NextRequest, NextResponse } from "next/server";
import { getAdminPayload, unauthorized } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  const templates = await prisma.whatsAppTemplate.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { campaigns: true } } },
  });
  return NextResponse.json(templates);
}

export async function POST(req: NextRequest) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  try {
    const { name, message, footer } = await req.json();
    if (!name || !message) {
      return NextResponse.json({ error: "Nome e mensagem são obrigatórios" }, { status: 400 });
    }
    const template = await prisma.whatsAppTemplate.create({
      data: { name, message, footer: footer || null },
    });
    return NextResponse.json(template, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: "Erro ao criar template" }, { status: 500 });
  }
}
