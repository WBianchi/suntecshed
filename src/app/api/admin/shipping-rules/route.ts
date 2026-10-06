import { NextRequest, NextResponse } from "next/server";
import { getAdminPayload, unauthorized } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  const rules = await prisma.shippingRule.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json({ rules });
}

export async function POST(req: NextRequest) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  try {
    const body = await req.json();
    const { name, price, estimatedDays, country, state, city, cepRangeStart, cepRangeEnd, active, order } = body;

    if (!name || price === undefined || price === null) {
      return NextResponse.json({ error: "Nome e valor são obrigatórios" }, { status: 400 });
    }

    const rule = await prisma.shippingRule.create({
      data: {
        name,
        price: Number(price),
        estimatedDays: estimatedDays ? Number(estimatedDays) : null,
        country: country || null,
        state: state || null,
        city: city || null,
        cepRangeStart: cepRangeStart ? cepRangeStart.replace(/\D/g, "") : null,
        cepRangeEnd: cepRangeEnd ? cepRangeEnd.replace(/\D/g, "") : null,
        active: active ?? true,
        order: order ?? 0,
      },
    });

    return NextResponse.json(rule, { status: 201 });
  } catch (error: any) {
    console.error("Create shipping rule error:", error);
    return NextResponse.json({ error: "Erro ao criar regra de frete" }, { status: 500 });
  }
}
