import { NextRequest, NextResponse } from "next/server";
import { getAdminPayload, unauthorized } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  const { id } = await params;
  try {
    const body = await req.json();
    const { name, price, estimatedDays, country, state, city, cepRangeStart, cepRangeEnd, active, order } = body;

    const data: any = {};
    if (name !== undefined) data.name = name;
    if (price !== undefined) data.price = Number(price);
    if (estimatedDays !== undefined) data.estimatedDays = estimatedDays ? Number(estimatedDays) : null;
    if (country !== undefined) data.country = country || null;
    if (state !== undefined) data.state = state || null;
    if (city !== undefined) data.city = city || null;
    if (cepRangeStart !== undefined) data.cepRangeStart = cepRangeStart ? cepRangeStart.replace(/\D/g, "") : null;
    if (cepRangeEnd !== undefined) data.cepRangeEnd = cepRangeEnd ? cepRangeEnd.replace(/\D/g, "") : null;
    if (active !== undefined) data.active = active;
    if (order !== undefined) data.order = order;

    const rule = await prisma.shippingRule.update({ where: { id }, data });
    return NextResponse.json(rule);
  } catch (error: any) {
    console.error("Update shipping rule error:", error);
    return NextResponse.json({ error: "Erro ao atualizar regra de frete" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  const { id } = await params;
  try {
    await prisma.shippingRule.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Delete shipping rule error:", error);
    return NextResponse.json({ error: "Erro ao excluir regra de frete" }, { status: 500 });
  }
}
