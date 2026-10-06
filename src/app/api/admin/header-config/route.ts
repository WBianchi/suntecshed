import { NextRequest, NextResponse } from "next/server";
import { getAdminPayload, unauthorized } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  let config = await prisma.headerConfig.findFirst();
  if (!config) {
    config = await prisma.headerConfig.create({ data: {} });
  }
  return NextResponse.json(config);
}

export async function PUT(req: NextRequest) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  try {
    const body = await req.json();
    let config = await prisma.headerConfig.findFirst();
    if (config) {
      config = await prisma.headerConfig.update({ where: { id: config.id }, data: body });
    } else {
      config = await prisma.headerConfig.create({ data: body });
    }
    return NextResponse.json(config);
  } catch (error: any) {
    console.error("Header config error:", error);
    return NextResponse.json({ error: "Erro ao salvar" }, { status: 500 });
  }
}
