import { NextRequest, NextResponse } from "next/server";
import { getAdminPayload, unauthorized } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  const { id } = await params;
  const client = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, name: true, email: true, phone: true, cpf: true, cnpj: true,
      avatar: true, street: true, number: true, complement: true,
      neighborhood: true, city: true, state: true, zipCode: true,
      totalPurchases: true, cashback: true, isVip: true, createdAt: true, updatedAt: true,
      orders: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true, orderNumber: true, status: true, total: true, createdAt: true,
          items: { select: { name: true, quantity: true } },
        },
      },
      addresses: { orderBy: { isDefault: "desc" } },
      _count: { select: { orders: true, reviews: true, favorites: true } },
    },
  });

  if (!client) return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });
  return NextResponse.json(client);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  const { id } = await params;
  try {
    const body = await req.json();
    const { name, phone, cpf, cnpj, street, number, complement, neighborhood, city, state, zipCode, password, isVip } = body;
    const email = body.email ? body.email.toLowerCase().trim() : "";

    if (!name || !email) {
      return NextResponse.json({ error: "Nome e email são obrigatórios" }, { status: 400 });
    }

    const existing = await prisma.user.findFirst({ where: { email, NOT: { id } } });
    if (existing) {
      return NextResponse.json({ error: "Este email já está em uso por outro cliente" }, { status: 409 });
    }

    const data: any = {
      name, email, phone: phone || null, cpf: cpf || null, cnpj: cnpj || null,
      street: street || null, number: number || null, complement: complement || null,
      neighborhood: neighborhood || null, city: city || null, state: state || null,
      zipCode: zipCode || null,
    };
    if (isVip !== undefined) data.isVip = isVip;

    if (password && password.length >= 6) {
      const argon2 = await import("argon2");
      data.password = await argon2.default.hash(password);
    }

    const client = await prisma.user.update({ where: { id }, data });

    return NextResponse.json(client);
  } catch (error: any) {
    console.error("Update client error:", error);
    return NextResponse.json({ error: "Erro ao atualizar cliente" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getAdminPayload(req);
  if (!payload) return unauthorized();

  const { id } = await params;
  try {
    const user = await prisma.user.findUnique({ where: { id }, select: { _count: { select: { orders: true } } } });
    if (!user) return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 });

    if (user._count.orders > 0) {
      return NextResponse.json({ error: "Não é possível excluir cliente com pedidos. Considere desativá-lo." }, { status: 400 });
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Delete client error:", error);
    return NextResponse.json({ error: "Erro ao excluir cliente" }, { status: 500 });
  }
}
