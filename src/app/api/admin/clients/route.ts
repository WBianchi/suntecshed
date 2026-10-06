import { NextRequest, NextResponse } from "next/server";
import { getAdminPayload, unauthorized } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  const url = new URL(req.url);
  const search = url.searchParams.get("search") || "";
  const sort = url.searchParams.get("sort") || "createdAt";
  const order = url.searchParams.get("order") || "desc";
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "20");

  const where: any = { role: "CLIENT" };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
      { cpf: { contains: search, mode: "insensitive" } },
    ];
  }

  const [clients, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true, name: true, email: true, phone: true, cpf: true, cnpj: true,
        avatar: true, city: true, state: true, totalPurchases: true,
        cashback: true, isVip: true, createdAt: true, updatedAt: true,
        _count: { select: { orders: true, reviews: true, favorites: true } },
      },
      orderBy: { [sort]: order },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({
    clients,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(req: NextRequest) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  try {
    const body = await req.json();
    const { name, phone, cpf, cnpj, street, number, complement, neighborhood, city, state, zipCode, password, isVip } = body;
    const email = body.email ? body.email.toLowerCase().trim() : "";

    if (!name || !email) {
      return NextResponse.json({ error: "Nome e email são obrigatórios" }, { status: 400 });
    }

    if (!password || password.length < 6) {
      return NextResponse.json({ error: "Senha é obrigatória (mínimo 6 caracteres)" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Este email já está cadastrado" }, { status: 409 });
    }

    const argon2 = await import("argon2");
    const hashedPassword = await argon2.default.hash(password);

    const client = await prisma.user.create({
      data: {
        name, email, phone: phone || null, cpf: cpf || null, cnpj: cnpj || null,
        street: street || null, number: number || null, complement: complement || null,
        neighborhood: neighborhood || null, city: city || null, state: state || null,
        zipCode: zipCode || null, password: hashedPassword, role: "CLIENT",
        isVip: !!isVip,
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error: any) {
    console.error("Create client error:", error);
    return NextResponse.json({ error: "Erro ao criar cliente" }, { status: 500 });
  }
}
