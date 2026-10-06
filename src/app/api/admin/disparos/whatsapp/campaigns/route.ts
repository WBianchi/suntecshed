import { NextRequest, NextResponse } from "next/server";
import { getAdminPayload, unauthorized } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  const campaigns = await prisma.whatsAppCampaign.findMany({
    orderBy: { createdAt: "desc" },
    include: { template: { select: { name: true, message: true } } },
  });
  return NextResponse.json(campaigns);
}

export async function POST(req: NextRequest) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  try {
    const { name, templateId, recipientType, recipientIds, scheduledAt } = await req.json();
    if (!name || !templateId) {
      return NextResponse.json({ error: "Nome e template são obrigatórios" }, { status: 400 });
    }
    const status = scheduledAt ? "scheduled" : "draft";
    const campaign = await prisma.whatsAppCampaign.create({
      data: {
        name, templateId, recipientType: recipientType || "all",
        recipientIds: recipientIds || [],
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        status,
      },
    });
    return NextResponse.json(campaign, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: "Erro ao criar campanha" }, { status: 500 });
  }
}
