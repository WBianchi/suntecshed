import jwt, { type SignOptions } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "Suntecshed-fallback-secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export interface JwtPayload {
  userId: string;
  email: string;
  role: "ADMIN" | "CLIENT";
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: 60 * 60 * 24 * 7 });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export const AUTH_COOKIE_NAME = "Suntecshed_token";

interface ResetTokenPayload {
  userId: string;
  purpose: "password-reset";
}

// Token de curta duração (1h) só pra redefinição de senha — separado do
// token de sessão pra não dar acesso à conta, só permissão de trocar a senha.
export function signResetToken(userId: string): string {
  return jwt.sign({ userId, purpose: "password-reset" }, JWT_SECRET, { expiresIn: "1h" });
}

export function verifyResetToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as ResetTokenPayload;
    if (decoded.purpose !== "password-reset") return null;
    return { userId: decoded.userId };
  } catch {
    return null;
  }
}
