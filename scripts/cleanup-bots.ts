import { config } from "dotenv";
import { PrismaClient } from "../src/generated/prisma";

config(); // carrega .env com DATABASE_URL

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Buscando usuários suspeitos...");

  const users = await prisma.user.findMany({
    where: {
      role: "CLIENT",
      OR: [
        { name: { contains: "@" } },
        { email: { startsWith: "aurum", mode: "insensitive" } },
      ],
    },
    select: { id: true, name: true, email: true, _count: { select: { orders: true } } },
  });

  console.log(`📋 Encontrados ${users.length} usuários suspeitos:`);
  for (const u of users) {
    console.log(`   - ${u.email} (nome: ${u.name}, pedidos: ${u._count.orders})`);
  }

  if (users.length === 0) {
    console.log("✅ Nenhum usuário suspeito encontrado.");
    return;
  }

  const userIds = users.map((u) => u.id);

  // Deletar pedidos primeiro, depois usuários
  const deletedOrders = await prisma.order.deleteMany({ where: { userId: { in: userIds } } });
  console.log(`🗑️ ${deletedOrders.count} pedidos removidos.`);

  const deletedUsers = await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  console.log(`🗑️ ${deletedUsers.count} usuários removidos.`);

  console.log("✅ Limpeza concluída!");
}

main()
  .catch((e) => {
    console.error("❌ Erro:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
