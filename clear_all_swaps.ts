import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
await prisma.swap.deleteMany()
await prisma.rawSwap.deleteMany()
console.log('✅ Cleared all swaps')
await prisma.$disconnect()
