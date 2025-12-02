import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔄 Starting Telegram sync...')

    // NOTE: placeholder

    return NextResponse.json({
      success: true,
      message: 'Telegram sync requires session management - use manual script for now',
      instruction: 'Run: npx tsx scripts/sync-telegram.ts',
    })

  } catch (error: any) {
    console.error('❌ Telegram sync failed:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
