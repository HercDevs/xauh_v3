import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Get overall KPIs
    const [
      totalPosts,
      xPosts,
      telegramPosts,
      allWebEvents,
      totalClickouts,
      totalSwaps,
      volumeData,
      coinVolumeData,
    ] = await Promise.all([
      prisma.post.count(),
      prisma.post.count({ where: { channel: 'X' } }),
      prisma.post.count({ where: { channel: 'TG' } }),
      prisma.rawWebEvent.findMany({
        where: {
          eventType: 'page_view',
        },
        select: {
          sessionId: true,
          hostname: true,
        },
      }),
      prisma.clickout.count(),
      prisma.swap.count(),
      prisma.swap.aggregate({
        _sum: {
          tonValueUsd: true,
        },
      }),
      prisma.swap.aggregate({
        _sum: {
          amountOut: true, // Total XAUH coins traded
        },
      }),
    ])

    // Get unique sessions from web events
    const uniqueSessions = new Map<string, string>()
    allWebEvents.forEach(event => {
      if (!uniqueSessions.has(event.sessionId)) {
        const hostname = event.hostname || 'unknown'
        uniqueSessions.set(event.sessionId, hostname)
      }
    })
  
    // Categorise sessions by website based on hostname
    const sessionsByWebsite: Record<string, number> = {
      'xauh.gold': 0,
      'herculis.gold': 0,
      'herculis.li': 0,
      'herculis.ch': 0,
      'Other': 0,
    }

    uniqueSessions.forEach((hostname, sessionId) => {
      if (hostname.includes('xauh.gold')) {
        sessionsByWebsite['xauh.gold']++
      } else if (hostname.includes('herculis.gold')) {
        sessionsByWebsite['herculis.gold']++
      } else if (hostname.includes('herculis.li')) {
        sessionsByWebsite['herculis.li']++
      } else if (hostname.includes('herculis.ch')) {
        sessionsByWebsite['herculis.ch']++
      } else {
        sessionsByWebsite['Other']++
      }
    })

    const totalSessions = uniqueSessions.size

    // Calculate conversion rates
    const clickoutRate = totalSessions > 0 
      ? ((totalClickouts / totalSessions) * 100).toFixed(2)
      : '0.00'
    
    const swapRate = totalClickouts > 0
      ? ((totalSwaps / totalClickouts) * 100).toFixed(2)
      : '0.00'

    const endToEndRate = totalSessions > 0
      ? ((totalSwaps / totalSessions) * 100).toFixed(2)
      : '0.00'

    return NextResponse.json({
      posts: totalPosts,
      xPosts,
      telegramPosts,
      sessions: totalSessions,
      clickouts: totalClickouts,
      swaps: totalSwaps,
      volumeUsd: volumeData._sum.tonValueUsd || 0,
      volumeCoins: coinVolumeData._sum.amountOut || 0,
      sessionsByWebsite,
      conversionRates: {
        sessionToClickout: parseFloat(clickoutRate),
        clickoutToSwap: parseFloat(swapRate),
        endToEnd: parseFloat(endToEndRate),
      },
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
