import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()
const raw = await p.rawSwap.count()
const swaps = await p.swap.count()
console.log(`Raw: ${raw}, Swaps: ${swaps}`)
await p.$disconnect()
