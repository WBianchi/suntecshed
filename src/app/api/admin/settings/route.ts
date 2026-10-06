import { NextRequest, NextResponse } from "next/server";
import { getAdminPayload, unauthorized } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  let settings = await prisma.globalSettings.findFirst();
  if (!settings) {
    settings = await prisma.globalSettings.create({ data: {} });
  }
  return NextResponse.json(settings);
}

export async function PUT(req: NextRequest) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  try {
    const body = await req.json();
    let settings = await prisma.globalSettings.findFirst();
    if (settings) {
      settings = await prisma.globalSettings.update({ where: { id: settings.id }, data: body });
    } else {
      settings = await prisma.globalSettings.create({ data: body });
    }
    return NextResponse.json(settings);
  } catch (error: any) {
    console.error("Settings error:", error);
    return NextResponse.json({ error: "Erro ao salvar configurações" }, { status: 500 });
  }
}
