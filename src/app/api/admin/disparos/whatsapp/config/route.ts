import { NextRequest, NextResponse } from "next/server";
import { getAdminPayload, unauthorized } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  let config = await prisma.whatsAppConfig.findFirst();
  if (!config) {
    config = await prisma.whatsAppConfig.create({
      data: {
        wahaUrl: process.env.WAHA_API_URL || "http://localhost:9000",
        wahaApiKey: process.env.WAHA_API_KEY || "",
      },
    });
  }
  return NextResponse.json(config);
}

export async function PUT(req: NextRequest) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  try {
    const body = await req.json();
    let config = await prisma.whatsAppConfig.findFirst();
    if (config) {
      config = await prisma.whatsAppConfig.update({ where: { id: config.id }, data: body });
    } else {
      config = await prisma.whatsAppConfig.create({ data: body });
    }
    return NextResponse.json(config);
  } catch (error: any) {
    return NextResponse.json({ error: "Erro ao salvar config" }, { status: 500 });
  }
}
