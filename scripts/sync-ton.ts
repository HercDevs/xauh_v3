import { PrismaClient } from '@prisma/client'
import axios from 'axios'
import { config } from 'dotenv'

config({ override: true }) // Load .env file and override system env

const prisma = new PrismaClient()

const tonApiKey = process.env.TON_API_KEY || ''
const poolAddress = process.env.CAPITALDEX_POOL_ADDRESS || ''
const tokenAddress = process.env.XAUH_TOKEN_ADDRESS || ''

async function syncTonSwaps() {
  console.log('🔄 Starting TON swap sync...')

  if (!tonApiKey || !poolAddress || !tokenAddress) {
    console.error('❌ Missing TON API credentials or addresses in .env')
    process.exit(1)
  }

  console.log(`Token: ${tokenAddress}`)
  console.log(`Pool: ${poolAddress}`)

  try {
    // Get transactions for the pool address
    console.log('\n📱 Fetching pool transactions...')
    
    const response = await axios.get(
      `https://tonapi.io/v2/blockchain/accounts/${poolAddress}/transactions`,
      {
        headers: {
          Authorization: `Bearer ${tonApiKey}`,
        },
        params: {
          limit: 100,
        },
      }
    )

    const transactions = response.data.transactions || []
    console.log(`📊 Found ${transactions.length} transactions`)

    let newSwaps = 0
    let skippedSwaps = 0
    let skippedNoHash = 0

    for (const tx of transactions) {
      try {
        const txHash = tx.hash

        if (!txHash) {
          skippedNoHash++
          continue
        }

        // Check if transaction already exists
        const existing = await prisma.rawSwap.findUnique({
          where: { txHash },
        })

        if (existing) {
          skippedSwaps++
          continue
        }

        // Parse transaction data
        const inMsg = tx.in_msg
        const outMsgs = tx.out_msgs || []

        if (!inMsg || outMsgs.length === 0) {
          continue
        }

        // Get wallet address (sender)
        const wallet = inMsg.source?.address || 'unknown'

        // Parse amounts
        const tonValue = parseFloat(inMsg.value || '0') / 1e9 // Convert from nanotons

        // Determine swap side based on message flow
        let side = 'buy'
        let amountIn = tonValue
        let amountOut = 0

        // Try to extract XAUH amount from output messages
        // Look for jetton_transfer op code (0x0f8a7ea5) in decoded body
        for (const outMsg of outMsgs) {
          // Check if this is a jetton transfer
          if (outMsg.decoded_body?.sum_type === 'JettonTransfer' ||
              outMsg.decoded_op_name === 'jetton_transfer') {
            // XAUH tokens have 18 decimals
            const amount = outMsg.decoded_body?.value?.amount || outMsg.decoded_body?.amount
            if (amount) {
              amountOut = parseFloat(amount) / 1e18
            }
          }
        }

        // Skip if no meaningful value
        if (tonValue < 0.01) {
          continue
        }

        const swapData = {
          txHash,
          wallet,
          side,
          amountIn,
          amountOut,
          tonValueUsd: tonValue * 5, // Rough TON price estimate, would fetch real price in production
          swapAt: new Date(tx.utime * 1000),
        }

        // Create records
        await prisma.rawSwap.create({
          data: { ...swapData, fetchedAt: new Date() },
        })

        await prisma.swap.create({
          data: swapData,
        })

        newSwaps++
        console.log(`✅ New swap: ${tonValue.toFixed(2)} TON from ${wallet.substring(0, 10)}... (XAUH: ${amountOut.toFixed(2)})`)

      } catch (error: any) {
        console.error(`❌ Error processing transaction:`, error.message)
        if (error.code) console.error(`   Prisma error code: ${error.code}`)
      }
    }

    console.log(`\n✅ TON sync complete!`)
    console.log(`   New swaps: ${newSwaps}`)
    console.log(`   Skipped (duplicates): ${skippedSwaps}`)
    console.log(`   Skipped (no hash): ${skippedNoHash}`)

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
