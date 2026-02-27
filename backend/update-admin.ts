import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("👤 Atualizando usuário para admin...");

    const adminUser = await prisma.usuario.update({
      where: { email: "leo1907campos@hotmail.com" },
      data: { isAdmin: true }
    });

    console.log("✅ Usuário atualizado como admin!");
    console.log("📧 Email:", adminUser.email);
    console.log("🔐 Admin:", adminUser.isAdmin);
  } catch (error) {
    console.error("❌ Erro:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
