import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'

config({ override: true }) // Load .env file and override system env

const prisma = new PrismaClient()

async function checkXauhAmounts() {
  const swaps = await prisma.swap.findMany({
    take: 10,
    orderBy: { swapAt: 'desc' },
    select: {
      txHash: true,
      amountIn: true,
      amountOut: true,
      tonValueUsd: true,
      swapAt: true,
    },
  })

  console.log('Recent swaps:')
  swaps.forEach(s => {
    const date = s.swapAt.toISOString().split('T')[0]
    console.log(`  ${date} | TON: ${s.amountIn.toFixed(2)} | XAUH: ${s.amountOut.toFixed(2)} | USD: $${s.tonValueUsd.toFixed(2)}`)
  })

  const totalXauh = await prisma.swap.aggregate({
    _sum: { amountOut: true },
  })

  console.log(`\nTotal XAUH volume: ${totalXauh._sum.amountOut?.toFixed(2) || 0}`)

  await prisma.$disconnect()
}

checkXauhAmounts()
