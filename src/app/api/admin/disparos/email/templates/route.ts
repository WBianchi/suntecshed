import { NextRequest, NextResponse } from "next/server";
import { getAdminPayload, unauthorized } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  const templates = await prisma.emailTemplate.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { campaigns: true } } },
  });
  return NextResponse.json(templates);
}

export async function POST(req: NextRequest) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  try {
    const { name, subject, body, footer } = await req.json();
    if (!name || !subject || !body) {
      return NextResponse.json({ error: "Nome, assunto e corpo são obrigatórios" }, { status: 400 });
    }
    const template = await prisma.emailTemplate.create({
      data: { name, subject, body, footer: footer || null },
    });
    return NextResponse.json(template, { status: 201 });
  } catch (error: any) {
    console.error("Create email template error:", error);
    return NextResponse.json({ error: "Erro ao criar template" }, { status: 500 });
  }
}
