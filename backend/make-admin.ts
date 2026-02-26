import { PrismaClient } from "@prisma/client";
import { hashSenha } from "./src/utils/bcrypt";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("👤 Criando usuário admin...");

    const senhaHash = await hashSenha("admin123");

    const adminUser = await prisma.usuario.create({
      data: {
        nome: "Gabriel Admin",
        email: "gabrielkreverconzatti@gmail.com",
        senha: senhaHash,
        isAdmin: true,
      },
    });

    console.log("✅ Usuário admin criado com sucesso!");
    console.log("📧 Email:", adminUser.email);
    console.log("🔐 Admin:", adminUser.isAdmin);
  } catch (error) {
    console.error("❌ Erro:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
