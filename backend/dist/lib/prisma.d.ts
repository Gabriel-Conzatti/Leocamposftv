import { PrismaClient } from '@prisma/client';
declare let prisma: PrismaClient<import(".prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
export declare const getPrismaClient: () => PrismaClient<import(".prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
export declare const resetPrismaClient: () => Promise<PrismaClient<import(".prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>>;
export default prisma;
//# sourceMappingURL=prisma.d.ts.map