import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function clearSwaps() {
  console.log('🧹 Clearing swap data...')
  const deleted = await prisma.$transaction([
    prisma.swap.deleteMany(),
    prisma.rawSwap.deleteMany(),
  ])
  console.log(`✅ Deleted ${deleted[0].count} swaps and ${deleted[1].count} raw swaps`)
  await prisma.$disconnect()
}
clearSwaps()
