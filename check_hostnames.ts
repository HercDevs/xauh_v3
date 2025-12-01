import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkHostnames() {
  const events = await prisma.rawWebEvent.findMany({
    where: { eventType: 'page_view' },
    select: { hostname: true },
    take: 100
  })
  
  const uniqueHostnames = new Set(events.map(e => e.hostname))
  console.log('Unique hostnames found:')
  uniqueHostnames.forEach(h => console.log(`  - "${h}"`))
  
  await prisma.$disconnect()
}

checkHostnames()
