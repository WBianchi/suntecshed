/**
 * Cria (ou atualiza) o usuário admin e um usuário cliente.
 *
 * Uso:
 *   ADMIN_EMAIL=admin@suntecshed.com.br ADMIN_PASS='senha-forte' \
 *   CLIENT_EMAIL=cliente@suntecshed.com.br CLIENT_PASS='senha-forte' \
 *   npx tsx scripts/create-users.ts
 *
 * Idempotente: se o e-mail já existir, atualiza nome, papel e senha.
 * A senha nunca é impressa — só o e-mail e o papel de cada usuário.
 *
 * Hash: argon2 com as opções padrão, exatamente o que /api/auth/login
 * espera em argon2.verify().
 */
import "dotenv/config";
import argon2 from "argon2";
import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

function lerEnv(chave: string): string | undefined {
  const valor = process.env[chave];
  return valor && valor.trim() ? valor.trim() : undefined;
}

async function main() {
  const alvos = [
    {
      papel: "admin" as const,
      email: lerEnv("ADMIN_EMAIL") ?? "admin@suntecshed.com.br",
      nome: lerEnv("ADMIN_NAME") ?? "Admin Suntecshed",
      senha: lerEnv("ADMIN_PASS"),
    },
    {
      papel: "cliente" as const,
      email: lerEnv("CLIENT_EMAIL") ?? "cliente@suntecshed.com.br",
      nome: lerEnv("CLIENT_NAME") ?? "Cliente Teste",
      senha: lerEnv("CLIENT_PASS"),
    },
  ].filter((alvo) => alvo.senha);

  if (alvos.length === 0) {
    console.error("Nada a fazer: defina ADMIN_PASS e/ou CLIENT_PASS.");
    process.exitCode = 1;
    return;
  }

  for (const alvo of alvos) {
    const email = alvo.email.toLowerCase().trim();
    const password = await argon2.hash(alvo.senha as string);
    const role = alvo.papel === "admin" ? ("ADMIN" as const) : ("CLIENT" as const);

    const user = await prisma.user.upsert({
      where: { email },
      update: { name: alvo.nome, password, role },
      create: { email, name: alvo.nome, password, role },
      select: { id: true, email: true, name: true, role: true },
    });

    console.log(`ok  ${user.role.padEnd(6)} ${user.email}  (id ${user.id})`);
  }
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
