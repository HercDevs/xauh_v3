import { PrismaClient } from '@prisma/client'
import axios from 'axios'

const prisma = new PrismaClient()

async function testSync() {
  try {
    // Clear existing
    await prisma.swap.deleteMany()
    await prisma.rawSwap.deleteMany()

    console.log('🔄 Testing new sync logic...\n')

    const tonApiKey = process.env.TON_API_KEY
    const poolAddress = process.env.CAPITALDEX_POOL_ADDRESS

    const response = await axios.get(
      `https://tonapi.io/v2/blockchain/accounts/${poolAddress}/transactions`,
      {
        headers: { Authorization: `Bearer ${tonApiKey}` },
        params: { limit: 20 },
      }
    )

    const transactions = response.data.transactions || []
    let processed = 0

    for (const tx of transactions) {
      const inMsg = tx.in_msg
      const outMsgs = tx.out_msgs || []

      if (!inMsg || outMsgs.length === 0) continue

      const wallet = inMsg.source?.address || 'unknown'
      const tonValue = parseFloat(inMsg.value || '0') / 1e9

      if (tonValue < 0.01) continue

      // Extract XAUH token amount from jetton_transfer
      let amountOut = 0
      for (const outMsg of outMsgs) {
        if (outMsg.decoded_op_name === 'jetton_transfer' && outMsg.decoded_body?.amount) {
          amountOut = parseFloat(outMsg.decoded_body.amount) / 1e18
          break
        }
      }

      const swapData = {
        txHash: tx.hash,
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

      processed++

      if (processed <= 5) {
        console.log(`${swapData.swapAt.toISOString().split('T')[0]} - ${tonValue.toFixed(2)} TON → ${amountOut.toFixed(2)} XAUH`)
      }
    }

    const total = await prisma.swap.count()
    const totalVolume = await prisma.swap.aggregate({
      _sum: { amountOut: true },
    })

    console.log(`\n✅ Synced ${processed} swaps`)
    console.log(`📊 Total in database: ${total}`)
    console.log(`💰 Total XAUH volume: ${totalVolume._sum.amountOut?.toFixed(2)} XAUH`)

  } catch (error: any) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testSync()
