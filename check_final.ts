import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function check() {
  const swaps = await prisma.swap.count()
  const sample = await prisma.swap.findMany({ take: 3, orderBy: { swapAt: 'desc' } })
  console.log(`Total swaps: ${swaps}`)
  console.log('Sample:', JSON.stringify(sample, null, 2))
  await prisma.$disconnect()
}
check()
