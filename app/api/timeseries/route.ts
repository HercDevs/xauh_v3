import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { format, subDays } from 'date-fns'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const now = new Date()
    const thirtyDaysAgo = subDays(now, 30)

    // Get daily post counts
    const posts = await prisma.post.findMany({
      where: {
        postedAt: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        postedAt: true,
      },
    })

    // Get daily session counts
    const sessions = await prisma.session.findMany({
      where: {
        firstLandingAt: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        firstLandingAt: true,
      },
    })

    // Get daily clickout counts
    const clickouts = await prisma.clickout.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        createdAt: true,
      },
    })

    // Get daily swap counts and volume
    const swaps = await prisma.swap.findMany({
      where: {
        swapAt: {
          gte: thirtyDaysAgo,
        },
      },
      select: {
        swapAt: true,
        tonValueUsd: true,
      },
    })

    // Aggregate by day
    const dailyData: Record<string, any> = {}

    // Initialise all days with zeros
    for (let i = 0; i < 30; i++) {
      const date = format(subDays(now, i), 'yyyy-MM-dd')
      dailyData[date] = {
        date,
        posts: 0,
        sessions: 0,
        clickouts: 0,
        swaps: 0,
        volume: 0,
      }
    }

    // Count posts by day
    posts.forEach(post => {
      const date = format(new Date(post.postedAt), 'yyyy-MM-dd')
      if (dailyData[date]) {
        dailyData[date].posts++
      }
    })

    // Count sessions by day
    sessions.forEach(session => {
      const date = format(new Date(session.firstLandingAt), 'yyyy-MM-dd')
      if (dailyData[date]) {
        dailyData[date].sessions++
      }
    })

    // Count clickouts by day
    clickouts.forEach(clickout => {
      const date = format(new Date(clickout.createdAt), 'yyyy-MM-dd')
      if (dailyData[date]) {
        dailyData[date].clickouts++
      }
    })

    // Count swaps and volume by day
    swaps.forEach(swap => {
      const date = format(new Date(swap.swapAt), 'yyyy-MM-dd')
      if (dailyData[date]) {
        dailyData[date].swaps++
        dailyData[date].volume += swap.tonValueUsd
      }
    })

    // Convert to array and sort by date
    const timeseriesData = Object.values(dailyData).sort((a, b) => 
      a.date.localeCompare(b.date)
    )

    return NextResponse.json(timeseriesData)
  } catch (error) {
    console.error('Error fetching timeseries:', error)
    return NextResponse.json(
      { error: 'Failed to fetch timeseries data' },
      { status: 500 }
    )
  }
}
