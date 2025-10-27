import { PrismaClient } from '@prisma/client'
import axios from 'axios'

const prisma = new PrismaClient()

const tonApiKey = process.env.TON_API_KEY || ''
const tokenAddress = process.env.XAUH_TOKEN_ADDRESS || ''

async function syncTonSwaps() {
  console.log('🔄 Starting TON swap sync...')

  if (!tonApiKey || !tokenAddress) {
    console.error('❌ Missing TON_API_KEY or XAUH_TOKEN_ADDRESS in .env')
    process.exit(1)
  }

  try {
    console.log(`📱 Fetching transactions for token: ${tokenAddress}`)

    // Get jetton (token) transfers using TON API
    const response = await axios.get(
      `https://tonapi.io/v2/blockchain/accounts/${tokenAddress}/jettons`,
      {
        headers: {
          Authorization: `Bearer ${tonApiKey}`,
        },
        params: {
          limit: 100,
        },
      }
    )

    console.log('Response:', JSON.stringify(response.data, null, 2))

    // Try alternative endpoint - get all transactions for the token
    const txResponse = await axios.get(
      `https://tonapi.io/v2/blockchain/accounts/${tokenAddress}/transactions`,
      {
        headers: {
          Authorization: `Bearer ${tonApiKey}`,
        },
        params: {
          limit: 100,
        },
      }
    )

    const transactions = txResponse.data.transactions || []
    console.log(`📊 Found ${transactions.length} transactions`)

    let newSwaps = 0
    let updatedSwaps = 0

    for (const tx of transactions) {
      try {
        // Extract swap data from transaction
        // Note: This is simplified - actual swap detection requires analyzing the transaction structure
        const txHash = tx.hash
        
        // Check if transaction already exists
        const existing = await prisma.rawSwap.findUnique({
          where: { txHash },
        })

        if (existing) {
          console.log(`⏭️  Transaction ${txHash} already exists, skipping`)
          continue
        }

        // Parse transaction data
        // This is a basic example - actual implementation needs to decode swap messages
        const swapData = {
          txHash,
          wallet: tx.account?.address || 'unknown',
          side: 'buy', // Would need to determine from transaction data
          amountIn: 0, // Would parse from transaction
          amountOut: 0, // Would parse from transaction
          tonValueUsd: parseFloat(tx.in_msg?.value || '0') / 1e9, // Convert from nanotons
          swapAt: new Date(tx.utime * 1000),
        }

        // Only save if transaction has meaningful value
        if (swapData.tonValueUsd > 0) {
          await prisma.rawSwap.create({ data: { ...swapData, fetchedAt: new Date() } })
          await prisma.swap.create({ data: swapData })
          newSwaps++
          console.log(`✅ New swap: ${swapData.tonValueUsd.toFixed(2)} TON`)
        }
      } catch (error) {
        console.error(`❌ Error processing transaction:`, error)
      }
    }

    console.log(`✅ TON sync complete!`)
    console.log(`   New swaps: ${newSwaps}`)
    console.log(`   Updated swaps: ${updatedSwaps}`)

  } catch (error: any) {
    if (error.response) {
      console.error('❌ TON API error:', error.response.status, error.response.data)
    } else {
      console.error('❌ TON sync failed:', error.message)
    }
  } finally {
    await prisma.$disconnect()
  }
}

syncTonSwaps()
