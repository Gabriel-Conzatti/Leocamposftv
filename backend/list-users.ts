import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const usuarios = await prisma.usuario.findMany({
    select: { id: true, email: true, nome: true, isAdmin: true }
  });
  console.log("Usuários cadastrados:");
  console.log(JSON.stringify(usuarios, null, 2));
  await prisma.$disconnect();
}

main();
