import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, AUTH_COOKIE_NAME } from "@/lib/auth";
import * as argon2 from "argon2";

// GET — Full profile data
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Token inválido" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true, name: true, email: true, phone: true, cpf: true,
        avatar: true, role: true,
        street: true, number: true, complement: true, neighborhood: true,
        city: true, state: true, zipCode: true,
        createdAt: true,
      },
    });

    if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

    // Default (or most recent) saved address — fallback for checkout prefill
    const defaultAddress = await prisma.address.findFirst({
      where: { userId: payload.userId },
      orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
    });

    return NextResponse.json({ user, defaultAddress });
  } catch (error) {
    console.error("Profile get error:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// PUT — Update profile
export async function PUT(req: NextRequest) {
  try {
    const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: "Token inválido" }, { status: 401 });

    const body = await req.json();
    const { name, phone, cpf, street, number, complement, neighborhood, city, state, zipCode, currentPassword, newPassword } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (cpf !== undefined) updateData.cpf = cpf;
    if (street !== undefined) updateData.street = street;
    if (number !== undefined) updateData.number = number;
    if (complement !== undefined) updateData.complement = complement;
    if (neighborhood !== undefined) updateData.neighborhood = neighborhood;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (zipCode !== undefined) updateData.zipCode = zipCode;

    // Password change
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Senha atual é obrigatória" }, { status: 400 });
      }
      const user = await prisma.user.findUnique({ where: { id: payload.userId } });
      if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

      const valid = await argon2.verify(user.password, currentPassword);
      if (!valid) return NextResponse.json({ error: "Senha atual incorreta" }, { status: 400 });

      updateData.password = await argon2.hash(newPassword);
    }

    const user = await prisma.user.update({
      where: { id: payload.userId },
      data: updateData,
      select: {
        id: true, name: true, email: true, phone: true, cpf: true,
        avatar: true, role: true,
        street: true, number: true, complement: true, neighborhood: true,
        city: true, state: true, zipCode: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json({ error: "Erro ao atualizar perfil" }, { status: 500 });
  }
}
