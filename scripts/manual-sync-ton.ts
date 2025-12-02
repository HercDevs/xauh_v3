import { PrismaClient } from '@prisma/client'
import axios from 'axios'

const prisma = new PrismaClient()

async function syncTonSwaps() {
  try {
    const tonApiKey = process.env.TON_API_KEY
    const poolAddress = process.env.CAPITALDEX_POOL_ADDRESS

    if (!tonApiKey || !poolAddress) {
      console.log('❌ Missing credentials')
      return
    }

    console.log('🔄 Syncing TON swaps...')
    console.log(`Using pool: ${poolAddress}\n`)

    // First check current database state
    const currentSwaps = await prisma.swap.count()
    console.log(`Current swaps in database: ${currentSwaps}`)

    const response = await axios.get(
      `https://tonapi.io/v2/blockchain/accounts/${poolAddress}/transactions`,
      {
        headers: { Authorization: `Bearer ${tonApiKey}` },
        params: { limit: 100 },
      }
    )

    const transactions = response.data.transactions || []
    console.log(`Transactions from blockchain: ${transactions.length}\n`)

    let newSwaps = 0
    let skippedSwaps = 0

    for (const tx of transactions) {
      const txHash = tx.hash

      const existing = await prisma.rawSwap.findUnique({
        where: { txHash },
      })

      if (existing) {
        skippedSwaps++
        continue
      }

      const inMsg = tx.in_msg
      const outMsgs = tx.out_msgs || []

      if (!inMsg || outMsgs.length === 0) continue

      const wallet = inMsg.source?.address || 'unknown'
      const tonValue = parseFloat(inMsg.value || '0') / 1e9

      if (tonValue < 0.01) continue

      let amountOut = 0
      for (const outMsg of outMsgs) {
        if (outMsg.destination?.address === wallet) {
          amountOut = parseFloat(outMsg.value || '0') / 1e9
        }
      }

      const swapData = {
        txHash,
        wallet,
        side: 'buy',
        amountIn: tonValue,
        amountOut,
        tonValueUsd: tonValue * 5,
        swapAt: new Date(tx.utime * 1000),
      }

      await prisma.rawSwap.create({
        data: { ...swapData, fetchedAt: new Date() },
      })

      await prisma.swap.create({
        data: swapData,
      })

      newSwaps++

      if (newSwaps <= 5) {
        console.log(`Added: ${swapData.swapAt.toISOString().split('T')[0]} - ${tonValue.toFixed(2)} TON → ${amountOut.toFixed(2)} XAUH`)
      }
    }

    const finalCount = await prisma.swap.count()

    console.log(`\n✅ Sync complete:`)
    console.log(`- New swaps: ${newSwaps}`)
    console.log(`- Skipped (duplicates): ${skippedSwaps}`)
    console.log(`- Total in database: ${finalCount}`)

    // Run the verify script to analyze the data
    console.log('\n' + '='.repeat(70))
    console.log('Running data verification...\n')

  } catch (error: any) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

syncTonSwaps()
