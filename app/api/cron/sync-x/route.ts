import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import axios from 'axios'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (prevents unauthorized access)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const bearerToken = process.env.X_BEARER_TOKEN
    const username = process.env.X_USERNAME

    if (!bearerToken || !username) {
      return NextResponse.json(
        { error: 'Missing X API credentials' },
        { status: 500 }
      )
    }

    console.log('🔄 Starting X sync...')

    // Get user ID
    const userResponse = await axios.get(
      `https://api.twitter.com/2/users/by/username/${username}`,
      {
        headers: { Authorization: `Bearer ${bearerToken}` },
      }
    )

    const userId = userResponse.data.data.id

    // Get recent tweets
    const tweetsResponse = await axios.get(
      `https://api.twitter.com/2/users/${userId}/tweets`,
      {
        headers: { Authorization: `Bearer ${bearerToken}` },
        params: {
          max_results: 100,
          'tweet.fields': 'created_at,public_metrics,entities',
          exclude: 'retweets,replies',
        },
      }
    )

    const tweets = tweetsResponse.data.data || []
    let newTweets = 0
    let updatedTweets = 0

    for (const tweet of tweets) {
      const existing = await prisma.rawXPost.findUnique({
        where: { postId: tweet.id },
      })

      const tweetData = {
        postId: tweet.id,
        createdAt: new Date(tweet.created_at),
        text: tweet.text,
        url: `https://twitter.com/${username}/status/${tweet.id}`,
        impressions: tweet.public_metrics?.impression_count || 0,
        likes: tweet.public_metrics?.like_count || 0,
        replies: tweet.public_metrics?.reply_count || 0,
        reposts: tweet.public_metrics?.retweet_count || 0,
        linkClicks: 0,
      }

      if (existing) {
        await prisma.rawXPost.update({
          where: { postId: tweet.id },
          data: {
            impressions: tweetData.impressions,
            likes: tweetData.likes,
            replies: tweetData.replies,
            reposts: tweetData.reposts,
            fetchedAt: new Date(),
          },
        })
        updatedTweets++
      } else {
        await prisma.rawXPost.create({ data: tweetData })
        await prisma.post.create({
          data: {
            channel: 'X',
            externalId: tweet.id,
            postedAt: tweetData.createdAt,
            permalink: tweetData.url,
            text: tweetData.text,
          },
        })
        newTweets++
      }
    }

    console.log(`✅ X sync complete: ${newTweets} new, ${updatedTweets} updated`)

    return NextResponse.json({
      success: true,
      newTweets,
      updatedTweets,
      totalProcessed: tweets.length,
    })
  } catch (error: any) {
    console.error('❌ X sync failed:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
