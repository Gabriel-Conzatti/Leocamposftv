import { PrismaClient } from '@prisma/client';

// Singleton pattern para evitar múltiplas conexões
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const createPrismaClient = () => new PrismaClient({
  log: ['error'],
});

let prisma = globalForPrisma.prisma ?? createPrismaClient();

// Salva a instância globalmente em desenvolvimento
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export const getPrismaClient = () => prisma;

export const resetPrismaClient = async () => {
  await prisma.$disconnect().catch(() => undefined);
  prisma = createPrismaClient();

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
  }

  return prisma;
};

// Desconecta ao encerrar o processo
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export default prisma;
