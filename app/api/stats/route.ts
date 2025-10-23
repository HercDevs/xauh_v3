import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Get overall KPIs
    const [
      totalPosts,
      totalSessions,
      totalClickouts,
      totalSwaps,
      totalVolume,
    ] = await Promise.all([
      prisma.post.count(),
      prisma.session.count(),
      prisma.clickout.count(),
      prisma.swap.count(),
      prisma.swap.aggregate({
        _sum: {
          tonValueUsd: true,
        },
      }),
    ])

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
      sessions: totalSessions,
      clickouts: totalClickouts,
      swaps: totalSwaps,
      volume: totalVolume._sum.tonValueUsd || 0,
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
