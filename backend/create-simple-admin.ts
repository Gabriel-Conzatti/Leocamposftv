import { PrismaClient } from "@prisma/client";
import { hashSenha } from "./src/utils/bcrypt.js";

const prisma = new PrismaClient();

async function main() {
  try {
    // Deletar usuário admin simples se existir
    await prisma.usuario.deleteMany({
      where: { email: "admin@test.com" }
    });
    
    console.log("👤 Criando usuário admin simples...");
    const senhaHash = await hashSenha("123456");

    const adminUser = await prisma.usuario.create({
      data: {
        nome: "Admin",
        email: "admin@test.com",
        telefone: "11999999999",
        senha: senhaHash,
        isAdmin: true,
      },
    });

    console.log("✅ Usuário admin criado!");
    console.log("📧 Email: admin@test.com");
    console.log("🔐 Senha: 123456");
    console.log("Admin:", adminUser.isAdmin);
  } catch (error) {
    console.error("❌ Erro:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
