import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// 🚀 Proxy එකක් පාවිච්චි කරලා Prisma එක Lazy Load කරනවා. 
// මේකෙන් බිල්ඩ් වෙද්දී PrismaClient එක ක්‍රෑෂ් වෙන්නේ නැහැ, මොකද මේක වැඩ කරන්නේ ලයිව් රන් වෙද්දී විතරයි!
export const prisma = new Proxy({} as PrismaClient, {
  get: (target, prop) => {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = new PrismaClient();
    }
    return Reflect.get(globalForPrisma.prisma, prop);
  },
});
