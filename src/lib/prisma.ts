import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  // Prisma 7 updated by Dulanga
  return new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
  });
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

// Used sagala warahan option
export { prisma };

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;
