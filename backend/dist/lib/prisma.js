import { PrismaClient } from '@prisma/client';
// Singleton pattern para evitar múltiplas conexões
const globalForPrisma = globalThis;
const prisma = globalForPrisma.prisma ?? new PrismaClient({
    log: ['error'],
});
// Salva a instância globalmente em desenvolvimento
if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}
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
//# sourceMappingURL=prisma.js.map