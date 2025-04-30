import { PrismaClient } from "@/src/generated/client"

declare global {
  var prisma: PrismaClient | undefined
}

const prismadb = globalThis.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prismadb

export const db = prismadb

export default prismadb
