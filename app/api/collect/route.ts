import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      sessionId,
      eventType,
      path,
      referrer,
      utmSource,
      utmMedium,
      utmCampaign,
      utmContent,
      utmTerm,
      elementId,
      label,
      href,
    } = body

    // Validate required fields
    if (!sessionId || !eventType) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, eventType' },
        { status: 400 }
      )
    }

    // Store raw web event
    await prisma.rawWebEvent.create({
      data: {
        sessionId,
        eventType,
        path: path || null,
        referrer: referrer || null,
        utmSource: utmSource || null,
        utmMedium: utmMedium || null,
        utmCampaign: utmCampaign || null,
        utmContent: utmContent || null,
        utmTerm: utmTerm || null,
        elementId: elementId || null,
        label: label || null,
        href: href || null,
      },
    })

    // If this is a page_view and the session doesn't exist yet, create it
    if (eventType === 'page_view') {
      const existingSession = await prisma.session.findUnique({
        where: { sessionId },
      })

      if (!existingSession) {
        await prisma.session.create({
          data: {
            sessionId,
            firstUtmSource: utmSource || null,
            firstUtmMedium: utmMedium || null,
            firstUtmCampaign: utmCampaign || null,
            firstUtmContent: utmContent || null,
            firstUtmTerm: utmTerm || null,
            firstReferrer: referrer || null,
            firstLandingPath: path || null,
            firstLandingAt: new Date(),
          },
        })
      }
    }

    // If this is a dex_clickout, also create a clickout record
    if (eventType === 'dex_clickout' && href) {
      const clickId = `click_${Date.now()}_${Math.random().toString(36).substring(7)}`
      
      await prisma.clickout.create({
        data: {
          clickId,
          sessionId,
          dest: href,
          utmSource: utmSource || null,
          utmMedium: utmMedium || null,
          utmCampaign: utmCampaign || null,
          createdAt: new Date(),
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error collecting event:', error)
    return NextResponse.json(
      { error: 'Failed to collect event' },
      { status: 500 }
    )
  }
}
