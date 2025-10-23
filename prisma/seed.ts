import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Clear existing data
  await prisma.rawSwap.deleteMany()
  await prisma.clickout.deleteMany()
  await prisma.session.deleteMany()
  await prisma.rawWebEvent.deleteMany()
  await prisma.rawTelegramMessage.deleteMany()
  await prisma.rawXPost.deleteMany()
  await prisma.post.deleteMany()
  await prisma.swap.deleteMany()

  console.log('✓ Cleared existing data')

  // Seed X Posts (last 30 days)
  const xPosts = []
  const now = new Date()
  
  for (let i = 0; i < 15; i++) {
    const daysAgo = Math.floor(Math.random() * 30)
    const postDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
    
    xPosts.push({
      postId: `x_post_${i}`,
      createdAt: postDate,
      text: `Check out XAUH Gold Coin! 🪙 #XAUH #Crypto Post ${i}`,
      url: `https://x.com/xauh/status/${1000000 + i}`,
      impressions: Math.floor(Math.random() * 10000) + 1000,
      likes: Math.floor(Math.random() * 500) + 50,
      replies: Math.floor(Math.random() * 50) + 5,
      reposts: Math.floor(Math.random() * 100) + 10,
      linkClicks: Math.floor(Math.random() * 200) + 20,
    })
  }

  await prisma.rawXPost.createMany({ data: xPosts })
  console.log(`✓ Created ${xPosts.length} X posts`)

  // Seed Telegram Messages
  const tgMessages = []
  
  for (let i = 0; i < 10; i++) {
    const daysAgo = Math.floor(Math.random() * 30)
    const postDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
    
    tgMessages.push({
      messageId: 1000 + i,
      postedAt: postDate,
      text: `XAUH Gold Coin update ${i}! Join our community.`,
      views: Math.floor(Math.random() * 5000) + 500,
      forwards: Math.floor(Math.random() * 100) + 10,
    })
  }

  await prisma.rawTelegramMessage.createMany({ data: tgMessages })
  console.log(`✓ Created ${tgMessages.length} Telegram messages`)

  // Seed Website Sessions & Events
  const sessions = []
  const webEvents = []
  
  const utmSources = ['twitter', 'telegram', 'reddit', 'discord', null]
  const utmCampaigns = ['launch', 'weekly_update', 'ama', 'partnership', null]
  
  for (let i = 0; i < 100; i++) {
    const daysAgo = Math.floor(Math.random() * 30)
    const sessionDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
    const sessionId = `session_${i}`
    
    const utmSource = utmSources[Math.floor(Math.random() * utmSources.length)]
    const utmCampaign = utmCampaigns[Math.floor(Math.random() * utmCampaigns.length)]
    
    sessions.push({
      sessionId,
      firstUtmSource: utmSource,
      firstUtmMedium: utmSource ? 'social' : null,
      firstUtmCampaign: utmCampaign,
      firstReferrer: utmSource ? `https://${utmSource}.com` : null,
      firstLandingPath: '/',
      firstLandingAt: sessionDate,
    })

    // Page view event
    webEvents.push({
      sessionId,
      eventType: 'page_view',
      path: '/',
      referrer: utmSource ? `https://${utmSource}.com` : null,
      utmSource,
      utmMedium: utmSource ? 'social' : null,
      utmCampaign,
      createdAt: sessionDate,
    })

    // Some sessions have clickouts (30% chance)
    if (Math.random() < 0.3) {
      const clickDate = new Date(sessionDate.getTime() + Math.random() * 60000) // within 1 min
      webEvents.push({
        sessionId,
        eventType: 'dex_clickout',
        path: '/',
        href: 'https://capitaldex.exchange/swap/xauh',
        utmSource,
        utmMedium: utmSource ? 'social' : null,
        utmCampaign,
        createdAt: clickDate,
      })
    }
  }

  await prisma.session.createMany({ data: sessions })
  await prisma.rawWebEvent.createMany({ data: webEvents })
  console.log(`✓ Created ${sessions.length} sessions and ${webEvents.length} web events`)

  // Seed Clickouts (subset of web events)
  const clickouts = webEvents
    .filter(e => e.eventType === 'dex_clickout')
    .map((e, i) => ({
      clickId: `click_${i}`,
      sessionId: e.sessionId,
      dest: e.href || 'https://capitaldex.exchange',
      utmSource: e.utmSource,
      utmMedium: e.utmMedium,
      utmCampaign: e.utmCampaign,
      createdAt: e.createdAt,
    }))

  await prisma.clickout.createMany({ data: clickouts })
  console.log(`✓ Created ${clickouts.length} clickouts`)

  // Seed Swaps (small % of clickouts convert)
  const swaps = []
  const rawSwaps = []
  
  for (let i = 0; i < Math.floor(clickouts.length * 0.15); i++) { // 15% conversion
    const daysAgo = Math.floor(Math.random() * 30)
    const swapDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
    const wallet = `0x${Math.random().toString(36).substring(2, 15)}`
    const side = Math.random() > 0.5 ? 'buy' : 'sell'
    const tonValue = Math.random() * 1000 + 100
    
    const swapData = {
      txHash: `0x${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
      wallet,
      side,
      amountIn: side === 'buy' ? tonValue : Math.random() * 10000,
      amountOut: side === 'buy' ? Math.random() * 10000 : tonValue,
      tonValueUsd: tonValue,
      swapAt: swapDate,
    }
    
    swaps.push(swapData)
    rawSwaps.push({ ...swapData, fetchedAt: new Date() })
  }

  await prisma.swap.createMany({ data: swaps })
  await prisma.rawSwap.createMany({ data: rawSwaps })
  console.log(`✓ Created ${swaps.length} swaps`)

  // Seed canonical Posts
  const posts = []
  
  // Add X posts
  const xPostsData = await prisma.rawXPost.findMany()
  for (const xp of xPostsData) {
    posts.push({
      channel: 'X',
      externalId: xp.postId,
      postedAt: xp.createdAt,
      permalink: xp.url,
      text: xp.text,
    })
  }
  
  // Add Telegram posts
  const tgData = await prisma.rawTelegramMessage.findMany()
  for (const tg of tgData) {
    posts.push({
      channel: 'TG',
      externalId: `tg_${tg.messageId}`,
      postedAt: tg.postedAt,
      permalink: `https://t.me/xauh/${tg.messageId}`,
      text: tg.text,
    })
  }

  await prisma.post.createMany({ data: posts })
  console.log(`✓ Created ${posts.length} canonical posts`)

  console.log('✅ Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
