import { NextRequest, NextResponse } from "next/server";
import { verifyToken, AUTH_COOKIE_NAME, type JwtPayload } from "@/lib/auth";

export function getAdminPayload(req: NextRequest): JwtPayload | null {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload || payload.role !== "ADMIN") return null;
  return payload;
}

export function unauthorized() {
  return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
}
