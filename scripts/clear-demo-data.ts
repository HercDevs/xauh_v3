import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function clearDemoData() {
  console.log('🧹 Clearing demo session and clickout data...')

  try {
    const deleted = await prisma.$transaction([
      prisma.clickout.deleteMany(),
      prisma.session.deleteMany(),
      prisma.rawWebEvent.deleteMany(),
    ])

    console.log('✅ Cleared:')
    console.log(`   - ${deleted[0].count} clickouts`)
    console.log(`   - ${deleted[1].count} sessions`)
    console.log(`   - ${deleted[2].count} web events`)
    console.log('\n✨ Dashboard will now show only real tracking data!')
  } catch (error) {
    console.error('❌ Error clearing data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

clearDemoData()
