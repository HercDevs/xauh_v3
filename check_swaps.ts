import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function check() {
  const rawCount = await prisma.rawSwap.count()
  const swapCount = await prisma.swap.count()
  const raw = await prisma.rawSwap.findMany({ take: 3 })
  console.log(`Raw swaps: ${rawCount}, Canonical swaps: ${swapCount}`)
  if (raw.length > 0) console.log('Sample raw swap:', raw[0])
  await prisma.$disconnect()
}
check()
