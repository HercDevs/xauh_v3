import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function countSwaps() {
  const count = await prisma.swap.count()
  const rawCount = await prisma.rawSwap.count()

  console.log('Swaps in canonical table:', count)
  console.log('Swaps in raw table:', rawCount)

  await prisma.$disconnect()
}

countSwaps()
