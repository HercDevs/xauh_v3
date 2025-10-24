import { PrismaClient } from '@prisma/client'
import axios from 'axios'

const prisma = new PrismaClient()

const bearerToken = process.env.X_BEARER_TOKEN || ''
const username = process.env.X_USERNAME || ''

async function syncXPosts() {
  console.log('🔄 Starting X (Twitter) sync...')

  if (!bearerToken || !username) {
    console.error('❌ Missing X_BEARER_TOKEN or X_USERNAME in .env')
    process.exit(1)
  }

  try {
    // Step 1: Get user ID from username
    console.log(`📱 Looking up user: @${username}`)
    
    const userResponse = await axios.get(
      `https://api.twitter.com/2/users/by/username/${username}`,
      {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
        },
      }
    )

    const userId = userResponse.data.data.id
    console.log(`✅ Found user ID: ${userId}`)

    // Step 2: Get recent tweets
    console.log('📨 Fetching recent tweets...')
    
    const tweetsResponse = await axios.get(
      `https://api.twitter.com/2/users/${userId}/tweets`,
      {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
        },
        params: {
          max_results: 100,
          'tweet.fields': 'created_at,public_metrics,entities',
          exclude: 'retweets,replies',
        },
      }
    )

    const tweets = tweetsResponse.data.data || []
    console.log(`📊 Found ${tweets.length} tweets`)

    let newTweets = 0
    let updatedTweets = 0

    for (const tweet of tweets) {
      try {
        // Extract link clicks (if available - this requires higher API tier)
        const linkClicks = 0 // Basic API doesn't provide this, would need Analytics API

        // Check if tweet already exists
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
          linkClicks,
        }

        if (existing) {
          // Update metrics (they change over time)
          await prisma.rawXPost.update({
            where: { postId: tweet.id },
            data: {
              impressions: tweetData.impressions,
              likes: tweetData.likes,
              replies: tweetData.replies,
              reposts: tweetData.reposts,
              linkClicks: tweetData.linkClicks,
              fetchedAt: new Date(),
            },
          })
          updatedTweets++
        } else {
          // Create new tweet
          await prisma.rawXPost.create({
            data: tweetData,
          })

          // Also add to canonical posts table
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
      } catch (error) {
        console.error(`❌ Error processing tweet ${tweet.id}:`, error)
      }
    }

    console.log(`✅ X sync complete!`)
    console.log(`   New tweets: ${newTweets}`)
    console.log(`   Updated tweets: ${updatedTweets}`)

  } catch (error: any) {
    console.error('❌ X sync failed:', error.response?.data || error.message)
  } finally {
    await prisma.$disconnect()
  }
}

syncXPosts()
