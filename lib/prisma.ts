import { PrismaClient } from '../src/generated/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit during hot reloads.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma; 