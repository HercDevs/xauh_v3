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

    // NOTE: Telegram sync via API requires session management which is complex
    // in serverless environments. For now, this returns a placeholder.
    // You would need to:
    // 1. Store the Telegram session string in your database
    // 2. Reuse it on each sync
    // 3. Handle session expiry
    
    // For a production system, consider:
    // - Using Telegram Bot API instead (simpler but different data)
    // - Running a separate long-lived process for Telegram client
    // - Using a service like n8n or Zapier for Telegram automation

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
