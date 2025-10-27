import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Get overall KPIs
    const [
      totalPosts,
      allSessions,
      totalClickouts,
      totalSwaps,
      volumeData,
      coinVolumeData,
    ] = await Promise.all([
      prisma.post.count(),
      prisma.session.findMany({
        select: {
          firstReferrer: true,
          firstLandingPath: true,
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

    // Categorize sessions by website based on referrer or landing path
    const sessionsByWebsite: Record<string, number> = {
      'xauh.gold': 0,
      'herculis.gold': 0,
      'herculis.li': 0,
      'Other': 0,
    }

    allSessions.forEach(session => {
      const referrer = session.firstReferrer || ''
      const path = session.firstLandingPath || ''
      
      if (referrer.includes('xauh.gold') || path.includes('xauh')) {
        sessionsByWebsite['xauh.gold']++
      } else if (referrer.includes('herculis.gold') || path.includes('herculis.gold')) {
        sessionsByWebsite['herculis.gold']++
      } else if (referrer.includes('herculis.li') || path.includes('herculis.li')) {
        sessionsByWebsite['herculis.li']++
      } else {
        sessionsByWebsite['Other']++
      }
    })

    const totalSessions = allSessions.length

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
