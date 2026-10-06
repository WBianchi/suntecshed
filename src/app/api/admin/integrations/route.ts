import { NextRequest, NextResponse } from "next/server";
import { getAdminPayload, unauthorized } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  const url = new URL(req.url);
  const provider = url.searchParams.get("provider");

  if (provider) {
    const setting = await prisma.integrationSetting.findUnique({ where: { provider } });
    return NextResponse.json(setting || { provider, enabled: false, config: {} });
  }

  const settings = await prisma.integrationSetting.findMany({ orderBy: { provider: "asc" } });
  return NextResponse.json(settings);
}

export async function PUT(req: NextRequest) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  try {
    const body = await req.json();
    const { provider, enabled, config } = body;

    if (!provider) {
      return NextResponse.json({ error: "Provider é obrigatório" }, { status: 400 });
    }

    const setting = await prisma.integrationSetting.upsert({
      where: { provider },
      create: { provider, enabled: enabled ?? false, config: config ?? {} },
      update: { enabled: enabled ?? false, config: config ?? {} },
    });

    return NextResponse.json(setting);
  } catch (error: any) {
    console.error("Integration settings error:", error);
    return NextResponse.json({ error: "Erro ao salvar configuração" }, { status: 500 });
  }
}
