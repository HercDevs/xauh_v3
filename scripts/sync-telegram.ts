import { TelegramClient } from 'telegram'
import { StringSession } from 'telegram/sessions'
import { PrismaClient } from '@prisma/client'
import input from 'input'

const prisma = new PrismaClient()

const apiId = parseInt(process.env.TELEGRAM_API_ID || '0')
const apiHash = process.env.TELEGRAM_API_HASH || ''
const channelUsername = process.env.TELEGRAM_CHANNEL || ''
const sessionString = process.env.TELEGRAM_SESSION_STRING || ''

// StringSession stores your login
const stringSession = new StringSession(sessionString)

async function syncTelegramMessages() {
  console.log('🔄 Starting Telegram sync...')

  // Create Telegram client
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  })

  try {
    // Connect and authenticate
    await client.start({
      phoneNumber: async () => await input.text('Enter your phone number: '),
      password: async () => await input.text('Enter your password (if 2FA enabled): '),
      phoneCode: async () => await input.text('Enter the code you received: '),
      onError: (err) => console.log(err),
    })

    console.log('✅ Connected to Telegram')
    console.log('Session string:', client.session.save())
    console.log('⚠️  Save this session string to avoid logging in every time!')

    // Get channel
    const channel = await client.getEntity(channelUsername)
    console.log(`📱 Found channel: ${channel.title}`)

    // Get recent messages (last 100)
    const messages = await client.getMessages(channel, { limit: 100 })
    
    console.log(`📨 Found ${messages.length} messages`)

    let newMessages = 0
    let updatedMessages = 0

    for (const msg of messages) {
      if (!msg.message) continue // Skip service messages

      try {
        // Check if message already exists
        const existing = await prisma.rawTelegramMessage.findUnique({
          where: { messageId: msg.id },
        })

        const messageData = {
          messageId: msg.id,
          postedAt: msg.date ? new Date(msg.date * 1000) : new Date(),
          text: msg.message || '',
          views: msg.views || 0,
          forwards: msg.forwards || 0,
        }

        if (existing) {
          // Update existing message (views/forwards may have changed)
          await prisma.rawTelegramMessage.update({
            where: { messageId: msg.id },
            data: {
              views: messageData.views,
              forwards: messageData.forwards,
              fetchedAt: new Date(),
            },
          })
          updatedMessages++
        } else {
          // Create new message
          await prisma.rawTelegramMessage.create({
            data: messageData,
          })

          // Also add to canonical posts table
          await prisma.post.create({
            data: {
              channel: 'TG',
              externalId: `tg_${msg.id}`,
              postedAt: messageData.postedAt,
              permalink: `https://t.me/${channelUsername}/${msg.id}`,
              text: messageData.text,
            },
          })
          newMessages++
        }
      } catch (error) {
        console.error(`❌ Error processing message ${msg.id}:`, error)
      }
    }

    console.log(`✅ Sync complete!`)
    console.log(`   New messages: ${newMessages}`)
    console.log(`   Updated messages: ${updatedMessages}`)

  } catch (error) {
    console.error('❌ Telegram sync failed:', error)
  } finally {
    await client.disconnect()
    await prisma.$disconnect()
  }
}

syncTelegramMessages()
