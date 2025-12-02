import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Get all clickouts with their hostname
    const clickouts = await prisma.clickout.findMany({
      select: {
        clickId: true,
        sessionId: true,
        dest: true,
        hostname: true,
        utmSource: true,
        utmMedium: true,
        utmCampaign: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Group clickouts by hostname
    const clickoutsByWebsite: Record<string, number> = {
      'xauh.gold': 0,
      'herculis.gold': 0,
      'herculis.li': 0,
      'herculis.ch': 0,
      'Other': 0,
    }

    clickouts.forEach(clickout => {
      const hostname = clickout.hostname || 'unknown'

      if (hostname.includes('xauh.gold')) {
        clickoutsByWebsite['xauh.gold']++
      } else if (hostname.includes('herculis.gold')) {
        clickoutsByWebsite['herculis.gold']++
      } else if (hostname.includes('herculis.li')) {
        clickoutsByWebsite['herculis.li']++
      } else if (hostname.includes('herculis.ch')) {
        clickoutsByWebsite['herculis.ch']++
      } else {
        clickoutsByWebsite['Other']++
      }
    })

    return NextResponse.json({
      total: clickouts.length,
      byWebsite: clickoutsByWebsite,
      recentClickouts: clickouts.map(c => ({
        id: c.clickId,
        website: c.hostname || 'unknown',
        dest: c.dest,
        utm: {
          source: c.utmSource,
          medium: c.utmMedium,
          campaign: c.utmCampaign,
        },
        createdAt: c.createdAt,
      })),
    })
  } catch (error) {
    console.error('Error fetching clickouts by website:', error)
    return NextResponse.json(
      { error: 'Failed to fetch clickouts' },
      { status: 500 }
    )
  }
}
